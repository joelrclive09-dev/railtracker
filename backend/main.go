package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	_ "github.com/lib/pq"
)

// IST Timezone (UTC + 5:30)
var istLocation = time.FixedZone("IST", 5*3600+30*60)

// Station representation
type Station struct {
	Code  string `json:"code"`
	Name  string `json:"name"`
	IsHub bool   `json:"is_hub"`
}

// Stop within a train itinerary
type TrainStop struct {
	StationCode   string `json:"station_code"`
	StationName   string `json:"station_name"`
	StopSequence  int    `json:"stop_sequence"`
	ArrivalTime   string `json:"arrival_time"`
	DepartureTime string `json:"departure_time"`
	ContinuousArr int    `json:"continuous_arr"` // Continuous minutes from Day 0 midnight
	ContinuousDep int    `json:"continuous_dep"`
	Day           int    `json:"day"`
	Platform      int    `json:"platform"`
}

// Full Train Schedule
type Train struct {
	Number    string      `json:"train_number"`
	Name      string      `json:"train_name"`
	Stops     []TrainStop `json:"stops"`
	StopIndex map[string]int `json:"-"`
}

// Station visit index for quick lookups
type StationVisit struct {
	TrainNumber   string
	StopIndex     int
	ContinuousArr int
	ContinuousDep int
	ArrClockMin   int
	DepClockMin   int
}

// In-Memory Time-Expanded Railway Graph
type Graph struct {
	mu        sync.RWMutex
	Stations  map[string]*Station
	Trains    map[string]*Train
	ByStation map[string][]StationVisit
	HubCodes  []string
}

// Crowdsourced Train Ping
type TrainPing struct {
	TrainNumber    string    `json:"trainNumber"`
	CurrentStation string    `json:"currentStation"`
	DelayMin       int       `json:"delayMin"`
	SpeedKmph      int       `json:"speedKmph"`
	ReportedAt     time.Time `json:"reportedAt"`
}

// Thread-safe Crowdsource State
type LiveStore struct {
	mu    sync.RWMutex
	pings map[string]TrainPing
}

var (
	railGraph *Graph
	liveStore = &LiveStore{
		pings: make(map[string]TrainPing),
	}
)

// Helper: parse HH:MM or HH:MM:SS string to clock minutes [0, 1439]
func parseClockMinutes(s string) int {
	s = strings.TrimSpace(strings.ReplaceAll(s, "\"", ""))
	if s == "" {
		return -1
	}
	parts := strings.Split(s, ":")
	if len(parts) < 2 {
		return -1
	}
	h, errH := strconv.Atoi(parts[0])
	m, errM := strconv.Atoi(parts[1])
	if errH != nil || errM != nil {
		return -1
	}
	return h*60 + m
}

// Format continuous or clock minutes to HH:MM
func formatMinutes(totalMinutes int) string {
	if totalMinutes < 0 {
		return "--:--"
	}
	dayMin := totalMinutes % 1440
	h := dayMin / 60
	m := dayMin % 60
	return fmt.Sprintf("%02d:%02d", h, m)
}

// Format duration in minutes to e.g. "5h 25m"
func formatDuration(min int) string {
	if min < 0 {
		return "0m"
	}
	h := min / 60
	m := min % 60
	if h > 0 {
		return fmt.Sprintf("%dh %02dm", h, m)
	}
	return fmt.Sprintf("%dm", m)
}

// Deterministic platform allocator for consistent UI
func assignPlatform(stationCode string, trainNum string, stopSeq int) int {
	var h int
	for _, c := range stationCode + trainNum {
		h = (h*31 + int(c)) % 10007
	}
	h = (h + stopSeq) % 4
	return h + 1 // Platforms 1 to 4
}

// Load in-memory graph from PostgreSQL
func loadGraph(db *sql.DB) (*Graph, error) {
	log.Println("Loading Railway Graph from PostgreSQL...")
	start := time.Now()

	g := &Graph{
		Stations:  make(map[string]*Station),
		Trains:    make(map[string]*Train),
		ByStation: make(map[string][]StationVisit),
		HubCodes:  make([]string, 0, 300),
	}

	// 1. Load Stations
	sRows, err := db.Query("SELECT station_code, COALESCE(station_name, station_code), is_hub FROM stations")
	if err != nil {
		return nil, fmt.Errorf("query stations error: %w", err)
	}
	defer sRows.Close()

	for sRows.Next() {
		var code, name string
		var hub bool
		if err := sRows.Scan(&code, &name, &hub); err != nil {
			return nil, err
		}
		st := &Station{
			Code:  code,
			Name:  name,
			IsHub: hub,
		}
		g.Stations[code] = st
		if hub {
			g.HubCodes = append(g.HubCodes, code)
		}
	}

	// 2. Load Schedules
	qRows, err := db.Query("SELECT train_number, COALESCE(train_name, ''), station_code, COALESCE(arrival_time, ''), COALESCE(departure_time, '') FROM schedules ORDER BY train_number, stop_sequence ASC")
	if err != nil {
		return nil, fmt.Errorf("query schedules error: %w", err)
	}
	defer qRows.Close()

	var curTrain *Train
	curDay := 0
	prevMin := -1

	for qRows.Next() {
		var tn, name, code, arrStr, depStr string
		if err := qRows.Scan(&tn, &name, &code, &arrStr, &depStr); err != nil {
			return nil, err
		}

		if curTrain == nil || curTrain.Number != tn {
			curTrain = &Train{
				Number:    tn,
				Name:      name,
				Stops:     make([]TrainStop, 0, 32),
				StopIndex: make(map[string]int),
			}
			g.Trains[tn] = curTrain
			curDay = 0
			prevMin = -1
		}

		arrMin := parseClockMinutes(arrStr)
		depMin := parseClockMinutes(depStr)

		// Fix dummy origin arrival or destination departure
		if len(curTrain.Stops) == 0 && arrMin <= 0 && depMin > 0 {
			arrMin = depMin
		}
		if arrMin < 0 && depMin >= 0 {
			arrMin = depMin
		}
		if depMin < 0 && arrMin >= 0 {
			depMin = arrMin
		}

		// Roll day when clock time is earlier than previous clock time
		if arrMin >= 0 {
			if prevMin >= 0 && arrMin < (prevMin%1440) {
				curDay++
			}
			prevMin = arrMin
		}
		contArr := curDay*1440 + arrMin

		if depMin >= 0 {
			if prevMin >= 0 && depMin < (prevMin%1440) {
				curDay++
			}
			prevMin = depMin
		}
		contDep := curDay*1440 + depMin

		stName := code
		if st, ok := g.Stations[code]; ok {
			stName = st.Name
		}

		stopIdx := len(curTrain.Stops)
		plat := assignPlatform(code, tn, stopIdx)

		curTrain.Stops = append(curTrain.Stops, TrainStop{
			StationCode:   code,
			StationName:   stName,
			StopSequence:  stopIdx + 1,
			ArrivalTime:   arrStr,
			DepartureTime: depStr,
			ContinuousArr: contArr,
			ContinuousDep: contDep,
			Day:           curDay,
			Platform:      plat,
		})
		curTrain.StopIndex[code] = stopIdx

		g.ByStation[code] = append(g.ByStation[code], StationVisit{
			TrainNumber:   tn,
			StopIndex:     stopIdx,
			ContinuousArr: contArr,
			ContinuousDep: contDep,
			ArrClockMin:   arrMin,
			DepClockMin:   depMin,
		})
	}

	log.Printf("Graph loaded successfully in %v: %d stations (%d hubs), %d trains",
		time.Since(start), len(g.Stations), len(g.HubCodes), len(g.Trains))
	return g, nil
}

// CORS Middleware
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

// GET /healthz
func handleHealthz(w http.ResponseWriter, r *http.Request) {
	railGraph.mu.RLock()
	defer railGraph.mu.RUnlock()

	resp := map[string]interface{}{
		"status":   "ok",
		"stations": len(railGraph.Stations),
		"trains":   len(railGraph.Trains),
		"hubs":     len(railGraph.HubCodes),
		"time_ist": time.Now().In(istLocation).Format("2006-01-02 15:04:05"),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

var stationAliases = map[string][]string{
	"KOLLAM":             {"QLN"},
	"QUILON":             {"QLN"},
	"TRIVANDRUM":         {"TVC", "KCVL"},
	"THIRUVANANTHAPURAM": {"TVC", "KCVL"},
	"COCHIN":             {"ERS", "ERN"},
	"ERNAKULAM":          {"ERS", "ERN"},
	"CALICUT":            {"CLT"},
	"KOZHIKODE":          {"CLT"},
	"BANGALORE":          {"SBC", "YPR", "SMVB"},
	"BENGALURU":          {"SBC", "YPR", "SMVB"},
	"MADRAS":             {"MAS", "MS"},
	"CHENNAI":            {"MAS", "MS", "TBM"},
	"BOMBAY":             {"MMCT", "CSMT", "BDTS", "LTT"},
	"MUMBAI":             {"MMCT", "CSMT", "BDTS", "LTT"},
	"CALCUTTA":           {"HWH", "SDAH", "KOAA"},
	"KOLKATA":            {"HWH", "SDAH", "KOAA"},
	"DELHI":              {"NDLS", "DLI", "NZM", "ANVT"},
	"NEW DELHI":          {"NDLS"},
	"RAMESHWARAM":        {"RMM"},
	"RAMESWARAM":         {"RMM"},
	"VARANASI":           {"BSB", "DDU"},
	"BANARAS":            {"BSBS", "BSB"},
	"HYDERABAD":          {"HYB", "SC", "KCG"},
	"SECUNDERABAD":       {"SC"},
	"AHMEDABAD":          {"ADI"},
}

// GET /api/v1/stations/search?q=...
func handleStationSearch(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(strings.ToUpper(r.URL.Query().Get("q")))
	w.Header().Set("Content-Type", "application/json")

	if q == "" {
		json.NewEncoder(w).Encode([]interface{}{})
		return
	}

	railGraph.mu.RLock()
	defer railGraph.mu.RUnlock()

	type Match struct {
		Station *Station
		Score   int
	}

	// Check aliases
	aliasBoost := make(map[string]int)
	for aliasKey, codes := range stationAliases {
		if strings.Contains(aliasKey, q) || strings.Contains(q, aliasKey) {
			for _, c := range codes {
				aliasBoost[c] = 950
			}
		}
	}

	var matches []Match
	for _, s := range railGraph.Stations {
		code := strings.ToUpper(s.Code)
		name := strings.ToUpper(s.Name)

		score := -1
		if boost, hasBoost := aliasBoost[code]; hasBoost {
			score = boost
		} else if code == q {
			score = 1000
		} else if strings.HasPrefix(code, q) {
			score = 800 - len(code)
		} else if strings.HasPrefix(name, q) {
			score = 600 - len(name)
		} else if strings.Contains(code, q) {
			score = 400
		} else if strings.Contains(name, q) {
			score = 200
		}

		if score > 0 {
			if s.IsHub {
				score += 50
			}
			matches = append(matches, Match{Station: s, Score: score})
		}
	}

	sort.Slice(matches, func(i, j int) bool {
		return matches[i].Score > matches[j].Score
	})

	limit := 15
	if len(matches) < limit {
		limit = len(matches)
	}

	result := make([]map[string]interface{}, 0, limit)
	for i := 0; i < limit; i++ {
		s := matches[i].Station
		displayName := s.Name
		if s.Code == "QLN" && !strings.Contains(displayName, "KOLLAM") {
			displayName = "KOLLAM JN (QUILON)"
		} else if s.Code == "TVC" && !strings.Contains(displayName, "TRIVANDRUM") {
			displayName = "THIRUVANANTHAPURAM (TRIVANDRUM)"
		} else if s.Code == "ERS" && !strings.Contains(displayName, "COCHIN") {
			displayName = "ERNAKULAM JN (COCHIN)"
		} else if s.Code == "CLT" && !strings.Contains(displayName, "CALICUT") {
			displayName = "KOZHIKODE (CALICUT)"
		}

		result = append(result, map[string]interface{}{
			"code":   s.Code,
			"name":   displayName,
			"is_hub": s.IsHub,
		})
	}

	json.NewEncoder(w).Encode(result)
}

// Models for Route Search
type RouteLeg struct {
	TrainNumber      string `json:"train_number"`
	TrainName        string `json:"train_name"`
	FromCode         string `json:"from_code"`
	FromName         string `json:"from_name"`
	ToCode           string `json:"to_code"`
	ToName           string `json:"to_name"`
	DepartureTime    string `json:"departure_time"`
	ArrivalTime      string `json:"arrival_time"`
	DurationMinutes  int    `json:"duration_minutes"`
	DurationFormatted string `json:"duration_formatted"`
	StopsCount       int    `json:"stops_count"`
	DeparturePlatform int   `json:"departure_platform"`
	ArrivalPlatform   int   `json:"arrival_platform"`
}

type LayoverInfo struct {
	HubCode                string `json:"hub_code"`
	HubName                string `json:"hub_name"`
	ArrivalTime            string `json:"arrival_time"`
	DepartureTime          string `json:"departure_time"`
	LayoverMinutes         int    `json:"layover_minutes"`
	LayoverFormatted       string `json:"layover_formatted"`
	ArrivalPlatform        int    `json:"arrival_platform"`
	DeparturePlatform      int    `json:"departure_platform"`
	BufferMinutes          int    `json:"buffer_minutes"`
	InterchangeWalkMinutes int    `json:"interchange_walk_minutes"`
}

type RouteOption struct {
	ID                     string       `json:"id"`
	Transfers              int          `json:"transfers"`
	TotalDurationMinutes   int          `json:"total_duration_minutes"`
	TotalDurationFormatted string       `json:"total_duration_formatted"`
	DepartureTime          string       `json:"departure_time"`
	ArrivalTime            string       `json:"arrival_time"`
	ReliabilityScore       float64      `json:"reliability_score"`
	ReliabilityRating      string       `json:"reliability_rating"`
	InterchangeGuidance    string       `json:"interchange_guidance"`
	Legs                   []RouteLeg   `json:"legs"`
	Layover                *LayoverInfo `json:"layover,omitempty"`
}

// GET /api/v1/routes/search
func handleRouteSearch(w http.ResponseWriter, r *http.Request) {
	fromCode := strings.TrimSpace(strings.ToUpper(r.URL.Query().Get("from")))
	toCode := strings.TrimSpace(strings.ToUpper(r.URL.Query().Get("to")))
	dateStr := strings.TrimSpace(r.URL.Query().Get("date"))
	if dateStr == "" {
		dateStr = time.Now().In(istLocation).Format("2006-01-02")
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 0 // default 0 = NO LIMIT
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	w.Header().Set("Content-Type", "application/json")

	if fromCode == "" || toCode == "" {
		http.Error(w, `{"error": "Missing 'from' or 'to' station code"}`, http.StatusBadRequest)
		return
	}

	railGraph.mu.RLock()
	defer railGraph.mu.RUnlock()

	fromSt, ok1 := railGraph.Stations[fromCode]
	toSt, ok2 := railGraph.Stations[toCode]
	if !ok1 || !ok2 {
		http.Error(w, `{"error": "Station not found in database"}`, http.StatusNotFound)
		return
	}

	var routes []RouteOption
	routeCount := 0

	// 1. Direct Trains Search
	fromVisits := railGraph.ByStation[fromCode]
	for _, vFrom := range fromVisits {
		train, exists := railGraph.Trains[vFrom.TrainNumber]
		if !exists {
			continue
		}
		toIdx, hasTo := train.StopIndex[toCode]
		if !hasTo || toIdx <= vFrom.StopIndex {
			continue
		}

		stopFrom := train.Stops[vFrom.StopIndex]
		stopTo := train.Stops[toIdx]

		dur := stopTo.ContinuousArr - stopFrom.ContinuousDep
		if dur < 0 {
			continue
		}

		routeCount++
		routeID := fmt.Sprintf("dir-%s-%d", train.Number, routeCount)

		leg := RouteLeg{
			TrainNumber:       train.Number,
			TrainName:         train.Name,
			FromCode:          fromCode,
			FromName:          fromSt.Name,
			ToCode:            toCode,
			ToName:            toSt.Name,
			DepartureTime:     formatMinutes(stopFrom.ContinuousDep),
			ArrivalTime:       formatMinutes(stopTo.ContinuousArr),
			DurationMinutes:   dur,
			DurationFormatted: formatDuration(dur),
			StopsCount:        toIdx - vFrom.StopIndex,
			DeparturePlatform: stopFrom.Platform,
			ArrivalPlatform:   stopTo.Platform,
		}

		routes = append(routes, RouteOption{
			ID:                     routeID,
			Transfers:              0,
			TotalDurationMinutes:   dur,
			TotalDurationFormatted: formatDuration(dur),
			DepartureTime:          leg.DepartureTime,
			ArrivalTime:            leg.ArrivalTime,
			ReliabilityScore:       100.0,
			ReliabilityRating:      "HIGH",
			InterchangeGuidance:    "Direct Train — no platform interchange required. Sit back and enjoy the journey.",
			Legs:                   []RouteLeg{leg},
		})
	}

	// 2. Two-Leg Hub Transfer Search
	toVisits := railGraph.ByStation[toCode]
	toTrainMap := make(map[string]StationVisit, len(toVisits))
	for _, tv := range toVisits {
		toTrainMap[tv.TrainNumber] = tv
	}

	// Pre-index legs for fast 2-leg discovery
	for _, vFrom := range fromVisits {
		train1, ok := railGraph.Trains[vFrom.TrainNumber]
		if !ok {
			continue
		}

		// Look through downstream stops that are junction hubs
		for i := vFrom.StopIndex + 1; i < len(train1.Stops); i++ {
			hubStop1 := train1.Stops[i]
			hubCode := hubStop1.StationCode
			stHub, isHub := railGraph.Stations[hubCode]
			if !isHub || !stHub.IsHub {
				continue
			}

			// Iterate candidate Leg 2 trains departing from this hub to 'toCode'
			for _, vHub2 := range railGraph.ByStation[hubCode] {
				if vHub2.TrainNumber == train1.Number {
					continue // Must be different train
				}

				vTo, reachesDest := toTrainMap[vHub2.TrainNumber]
				if !reachesDest || vTo.StopIndex <= vHub2.StopIndex {
					continue
				}

				train2, okT2 := railGraph.Trains[vHub2.TrainNumber]
				if !okT2 {
					continue
				}

				hubStop2 := train2.Stops[vHub2.StopIndex]
				toStop2 := train2.Stops[vTo.StopIndex]

				// Layover calculation within 24-hr timetable cycle
				arrClock := hubStop1.ContinuousArr % 1440
				depClock := hubStop2.ContinuousDep % 1440
				layover := (depClock - arrClock + 1440) % 1440

				// Strict layover bounds: 45 min to 360 min (6 hours)
				if layover < 45 || layover > 360 {
					continue
				}

				durLeg1 := hubStop1.ContinuousArr - train1.Stops[vFrom.StopIndex].ContinuousDep
				durLeg2 := toStop2.ContinuousArr - hubStop2.ContinuousDep
				totalDur := durLeg1 + layover + durLeg2

				// Connection Reliability Scoring: 1 - exp(-(layover - buffer) / meanDelay)
				buffer := 25.0 // 15m base walk + 10m FOB penalty
				meanDelay := 25.0
				score := (1.0 - math.Exp(-(float64(layover)-buffer)/meanDelay)) * 100.0
				if score < 0 {
					score = 0
				}
				if score > 100 {
					score = 100
				}

				rating := "RISKY"
				if score >= 90 {
					rating = "HIGH"
				} else if score >= 75 {
					rating = "MEDIUM"
				} else if score >= 55 {
					rating = "LOW"
				}

				plat1 := hubStop1.Platform
				plat2 := hubStop2.Platform

				var guidance string
				if plat1 == plat2 {
					guidance = fmt.Sprintf("Same Platform (%d) Interchange at %s. Layover: %dm. Cross-platform transfer.", plat1, stHub.Name, layover)
				} else {
					guidance = fmt.Sprintf("Transfer at %s: Arrive Platform %d. Use Foot Overbridge (FOB) to reach Platform %d. Estimated walk: 10-15m with luggage. Buffer: %dm.",
						stHub.Name, plat1, plat2, layover-25)
				}

				routeCount++
				routeID := fmt.Sprintf("hop-%s-%s-%s-%d", train1.Number, hubCode, train2.Number, routeCount)

				leg1 := RouteLeg{
					TrainNumber:       train1.Number,
					TrainName:         train1.Name,
					FromCode:          fromCode,
					FromName:          fromSt.Name,
					ToCode:            hubCode,
					ToName:            stHub.Name,
					DepartureTime:     formatMinutes(train1.Stops[vFrom.StopIndex].ContinuousDep),
					ArrivalTime:       formatMinutes(hubStop1.ContinuousArr),
					DurationMinutes:   durLeg1,
					DurationFormatted: formatDuration(durLeg1),
					StopsCount:        i - vFrom.StopIndex,
					DeparturePlatform: train1.Stops[vFrom.StopIndex].Platform,
					ArrivalPlatform:   plat1,
				}

				leg2 := RouteLeg{
					TrainNumber:       train2.Number,
					TrainName:         train2.Name,
					FromCode:          hubCode,
					FromName:          stHub.Name,
					ToCode:            toCode,
					ToName:            toSt.Name,
					DepartureTime:     formatMinutes(hubStop2.ContinuousDep),
					ArrivalTime:       formatMinutes(toStop2.ContinuousArr),
					DurationMinutes:   durLeg2,
					DurationFormatted: formatDuration(durLeg2),
					StopsCount:        vTo.StopIndex - vHub2.StopIndex,
					DeparturePlatform: plat2,
					ArrivalPlatform:   toStop2.Platform,
				}

				layoverInfo := &LayoverInfo{
					HubCode:                hubCode,
					HubName:                stHub.Name,
					ArrivalTime:            leg1.ArrivalTime,
					DepartureTime:          leg2.DepartureTime,
					LayoverMinutes:         layover,
					LayoverFormatted:       formatDuration(layover),
					ArrivalPlatform:        plat1,
					DeparturePlatform:      plat2,
					BufferMinutes:          25,
					InterchangeWalkMinutes: 10,
				}

				routes = append(routes, RouteOption{
					ID:                     routeID,
					Transfers:              1,
					TotalDurationMinutes:   totalDur,
					TotalDurationFormatted: formatDuration(totalDur),
					DepartureTime:          leg1.DepartureTime,
					ArrivalTime:            leg2.ArrivalTime,
					ReliabilityScore:       math.Round(score*10) / 10,
					ReliabilityRating:      rating,
					InterchangeGuidance:    guidance,
					Legs:                   []RouteLeg{leg1, leg2},
					Layover:                layoverInfo,
				})
			}
		}
	}

	// Sort results: fewest transfers first, shortest total duration second, highest reliability score third
	sort.Slice(routes, func(i, j int) bool {
		if routes[i].Transfers != routes[j].Transfers {
			return routes[i].Transfers < routes[j].Transfers
		}
		if routes[i].TotalDurationMinutes != routes[j].TotalDurationMinutes {
			return routes[i].TotalDurationMinutes < routes[j].TotalDurationMinutes
		}
		return routes[i].ReliabilityScore > routes[j].ReliabilityScore
	})

	totalFound := len(routes)
	if limit > 0 && limit < len(routes) {
		routes = routes[:limit]
	}

	resp := map[string]interface{}{
		"from": map[string]string{
			"code": fromSt.Code,
			"name": fromSt.Name,
		},
		"to": map[string]string{
			"code": toSt.Code,
			"name": toSt.Name,
		},
		"date":        dateStr,
		"total_count": totalFound,
		"limit":       limit,
		"routes":      routes,
	}

	json.NewEncoder(w).Encode(resp)
}

// Timeline stop item for Live Tracking
type LiveTimelineStop struct {
	StopSequence        int    `json:"stop_sequence"`
	StationCode         string `json:"station_code"`
	StationName         string `json:"station_name"`
	ScheduledArrival    string `json:"scheduled_arrival"`
	ScheduledDeparture  string `json:"scheduled_departure"`
	ExpectedArrival     string `json:"expected_arrival"`
	ExpectedDeparture   string `json:"expected_departure"`
	HaltDurationMinutes int    `json:"halt_duration_minutes"`
	Status              string `json:"status"` // DEPARTED, CURRENT, UPCOMING
	DelayMinutes        int    `json:"delay_minutes"`
	Platform            int    `json:"platform"`
	DistanceKmph        int    `json:"distance_km"`
}

// GET /api/v1/trains/live?number=...
func handleTrainLive(w http.ResponseWriter, r *http.Request) {
	trainNum := strings.TrimSpace(r.URL.Query().Get("number"))
	w.Header().Set("Content-Type", "application/json")

	if trainNum == "" {
		http.Error(w, `{"error": "Missing train number"}`, http.StatusBadRequest)
		return
	}

	railGraph.mu.RLock()
	train, exists := railGraph.Trains[trainNum]
	railGraph.mu.RUnlock()

	if !exists {
		http.Error(w, `{"error": "Train number not found"}`, http.StatusNotFound)
		return
	}

	// Check if live crowd report exists
	liveStore.mu.RLock()
	ping, hasPing := liveStore.pings[trainNum]
	liveStore.mu.RUnlock()

	nowIST := time.Now().In(istLocation)
	nowClockMin := nowIST.Hour()*60 + nowIST.Minute()

	totalDelay := 0
	speedKmph := 65
	if hasPing {
		totalDelay = ping.DelayMin
		if ping.SpeedKmph > 0 {
			speedKmph = ping.SpeedKmph
		}
	}

	// Build stop timeline
	numStops := len(train.Stops)
	timeline := make([]LiveTimelineStop, numStops)

	firstDep := train.Stops[0].ContinuousDep % 1440
	lastArr := train.Stops[numStops-1].ContinuousArr % 1440
	isOvernight := lastArr < firstDep

	// Find current position relative to stops
	currentStopIdx := -1
	inTransit := false

	// If crowd ping specified a station, pin it
	if hasPing && ping.CurrentStation != "" {
		if idx, ok := train.StopIndex[ping.CurrentStation]; ok {
			currentStopIdx = idx
		}
	}

	// If not pinned by crowd ping, estimate based on time of day
	if currentStopIdx == -1 {
		for i := 0; i < numStops-1; i++ {
			sCur := train.Stops[i]
			sNext := train.Stops[i+1]

			depTime := (sCur.ContinuousDep + totalDelay) % 1440
			arrNext := (sNext.ContinuousArr + totalDelay) % 1440

			if depTime <= arrNext {
				if nowClockMin >= depTime && nowClockMin < arrNext {
					currentStopIdx = i
					inTransit = true
					break
				}
			} else { // Overnight roll between halts
				if nowClockMin >= depTime || nowClockMin < arrNext {
					currentStopIdx = i
					inTransit = true
					break
				}
			}

			// Check if halted at station i
			arrCur := (sCur.ContinuousArr + totalDelay) % 1440
			if arrCur <= depTime {
				if nowClockMin >= arrCur && nowClockMin <= depTime {
					currentStopIdx = i
					inTransit = false
					break
				}
			}
		}

		if currentStopIdx == -1 {
			// Compare with origin and destination
			if !isOvernight {
				if nowClockMin < firstDep {
					currentStopIdx = 0
					inTransit = false
				} else if nowClockMin > lastArr {
					currentStopIdx = numStops - 1
					inTransit = false
				}
			} else {
				// Overnight train running
				currentStopIdx = numStops / 2
				inTransit = true
			}
		}
	}

	trainStatus := "IN_TRANSIT"
	if currentStopIdx <= 0 && nowClockMin < firstDep {
		trainStatus = "NOT_STARTED"
		speedKmph = 0
	} else if currentStopIdx >= numStops-1 && (nowClockMin > lastArr && !isOvernight) {
		trainStatus = "COMPLETED"
		speedKmph = 0
	} else if !inTransit {
		trainStatus = "HALTED_AT_STATION"
		speedKmph = 0
	}

	var progressPercent float64 = 0.0
	if currentStopIdx >= 0 && numStops > 1 {
		baseProg := float64(currentStopIdx) / float64(numStops-1) * 100.0
		if inTransit && currentStopIdx < numStops-1 {
			baseProg += (1.0 / float64(numStops-1)) * 50.0
		}
		progressPercent = math.Min(100.0, math.Max(0.0, baseProg))
	}

	for i, s := range train.Stops {
		haltMin := s.ContinuousDep - s.ContinuousArr
		if haltMin < 0 {
			haltMin = 0
		}

		status := "UPCOMING"
		if i < currentStopIdx {
			status = "DEPARTED"
		} else if i == currentStopIdx {
			if inTransit {
				status = "DEPARTED"
			} else {
				status = "CURRENT"
			}
		}

		expectedArr := formatMinutes(s.ContinuousArr + totalDelay)
		expectedDep := formatMinutes(s.ContinuousDep + totalDelay)

		timeline[i] = LiveTimelineStop{
			StopSequence:        s.StopSequence,
			StationCode:         s.StationCode,
			StationName:         s.StationName,
			ScheduledArrival:    formatMinutes(s.ContinuousArr),
			ScheduledDeparture:  formatMinutes(s.ContinuousDep),
			ExpectedArrival:     expectedArr,
			ExpectedDeparture:   expectedDep,
			HaltDurationMinutes: haltMin,
			Status:              status,
			DelayMinutes:        totalDelay,
			Platform:            s.Platform,
			DistanceKmph:        i * 45, // realistic milestone distance
		}
	}

	curStationObj := train.Stops[0]
	if currentStopIdx >= 0 && currentStopIdx < numStops {
		curStationObj = train.Stops[currentStopIdx]
	}

	nextIdx := currentStopIdx + 1
	if nextIdx >= numStops {
		nextIdx = numStops - 1
	}
	nextStationObj := train.Stops[nextIdx]

	resp := map[string]interface{}{
		"train_number": train.Number,
		"train_name":   train.Name,
		"status":       trainStatus,
		"current_station": map[string]interface{}{
			"code":     curStationObj.StationCode,
			"name":     curStationObj.StationName,
			"platform": curStationObj.Platform,
		},
		"next_station": map[string]interface{}{
			"code":     nextStationObj.StationCode,
			"name":     nextStationObj.StationName,
			"platform": nextStationObj.Platform,
		},
		"progress_percent":     math.Round(progressPercent*10) / 10,
		"estimated_speed_kmph": speedKmph,
		"delay_min":            totalDelay,
		"crowdsourced":         hasPing,
		"last_ping_time":       "",
		"timeline":             timeline,
	}

	if hasPing {
		resp["last_ping_time"] = ping.ReportedAt.In(istLocation).Format(time.RFC3339)
	}

	json.NewEncoder(w).Encode(resp)
}

// POST /api/v1/trains/ping
func handleTrainPing(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req TrainPing
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid JSON body"}`, http.StatusBadRequest)
		return
	}

	trainNum := strings.TrimSpace(req.TrainNumber)
	if trainNum == "" {
		http.Error(w, `{"error": "Missing trainNumber"}`, http.StatusBadRequest)
		return
	}

	req.TrainNumber = trainNum
	req.CurrentStation = strings.ToUpper(strings.TrimSpace(req.CurrentStation))
	req.ReportedAt = time.Now()

	liveStore.mu.Lock()
	liveStore.pings[trainNum] = req
	liveStore.mu.Unlock()

	log.Printf("Crowdsource ping accepted for train %s: station=%s, delay=%dm, speed=%d km/h",
		trainNum, req.CurrentStation, req.DelayMin, req.SpeedKmph)

	resp := map[string]interface{}{
		"status":  "success",
		"message": fmt.Sprintf("Live crowd report recorded for train %s", trainNum),
		"ping":    req,
	}
	json.NewEncoder(w).Encode(resp)
}

// Coach details for Coach Position / Vacant Berth Strip
type CoachInfo struct {
	ID           string `json:"id"`
	Type         string `json:"type"`
	Pillar       string `json:"pillar"`
	VacantBerths int    `json:"vacant_berths"`
	Occupancy    int    `json:"occupancy"`
	ClassCode    string `json:"class_code"`
}

// Generate realistic Indian Railways rake layout with simulated vacant berths
func generateRakeLayout(trainNum string) []CoachInfo {
	var seed int
	for _, c := range trainNum {
		seed = (seed*37 + int(c)) % 997
	}

	rakeCodes := []string{
		"ENG", "SLR", "GEN", "GEN", "S1", "S2", "S3", "S4", "S5", "S6",
		"B1", "B2", "B3", "B4", "A1", "GEN", "SLR",
	}

	coaches := make([]CoachInfo, len(rakeCodes))
	for i, c := range rakeCodes {
		pillar := fmt.Sprintf("P-%02d", i+1)
		coachType := "Sleeper Class"
		classCode := "SL"
		vacant := 6 + (seed+i*7)%9
		occupancy := 91 + (seed+i*3)%8

		switch {
		case c == "ENG":
			coachType = "Locomotive (WAP-7)"
			classCode = "ENG"
			vacant = 0
			occupancy = 100
		case c == "SLR":
			coachType = "Seating cum Luggage Rake"
			classCode = "2S"
			vacant = 2 + (seed+i)%4
			occupancy = 95
		case strings.HasPrefix(c, "GEN"):
			coachType = "General Unreserved"
			classCode = "GS"
			vacant = (seed + i) % 3
			occupancy = 98
		case strings.HasPrefix(c, "B"):
			coachType = "AC 3 Tier"
			classCode = "3A"
			vacant = 2 + (seed+i*5)%7
			occupancy = 94
		case strings.HasPrefix(c, "A"):
			coachType = "AC 2 Tier"
			classCode = "2A"
			vacant = 1 + (seed+i*3)%5
			occupancy = 92
		}

		coaches[i] = CoachInfo{
			ID:           c,
			Type:         coachType,
			Pillar:       pillar,
			VacantBerths: vacant,
			Occupancy:    occupancy,
			ClassCode:    classCode,
		}
	}
	return coaches
}

// GET /api/v1/stations/live-board?station=...&time=...
func handleStationLiveBoard(w http.ResponseWriter, r *http.Request) {
	stationCode := strings.TrimSpace(strings.ToUpper(r.URL.Query().Get("station")))
	if stationCode == "" {
		stationCode = "QLN" // Default Kollam Jn
	}

	timeParam := strings.TrimSpace(r.URL.Query().Get("time"))
	targetMin := -1
	if timeParam != "" {
		targetMin = parseClockMinutes(timeParam)
	}
	if targetMin < 0 {
		nowIST := time.Now().In(istLocation)
		targetMin = nowIST.Hour()*60 + nowIST.Minute()
	}

	w.Header().Set("Content-Type", "application/json")

	railGraph.mu.RLock()
	st, exists := railGraph.Stations[stationCode]
	visits := railGraph.ByStation[stationCode]
	railGraph.mu.RUnlock()

	if !exists {
		http.Error(w, `{"error": "Station not found"}`, http.StatusNotFound)
		return
	}

	liveStore.mu.RLock()
	pingsCopy := make(map[string]TrainPing, len(liveStore.pings))
	for k, v := range liveStore.pings {
		pingsCopy[k] = v
	}
	liveStore.mu.RUnlock()

	type BoardTrain struct {
		TrainNumber        string      `json:"train_number"`
		TrainName          string      `json:"train_name"`
		Platform           int         `json:"platform"`
		ScheduledArrival   string      `json:"scheduled_arrival"`
		ScheduledDeparture string      `json:"scheduled_departure"`
		ExpectedArrival    string      `json:"expected_arrival"`
		ExpectedDeparture  string      `json:"expected_departure"`
		DelayMin           int         `json:"delay_min"`
		Status             string      `json:"status"` // AT_PLATFORM, PASSING, APPROACHING, ON_TIME, DELAYED
		TimeDiffMin        int         `json:"time_diff_min"`
		Origin             string      `json:"origin"`
		Destination        string      `json:"destination"`
		Coaches            []CoachInfo `json:"coaches"`
	}

	var passingNow []BoardTrain
	var upcoming []BoardTrain

	for _, v := range visits {
		railGraph.mu.RLock()
		train, ok := railGraph.Trains[v.TrainNumber]
		railGraph.mu.RUnlock()
		if !ok || len(train.Stops) == 0 {
			continue
		}

		stop := train.Stops[v.StopIndex]
		delay := 0
		if p, hasP := pingsCopy[train.Number]; hasP {
			delay = p.DelayMin
		}

		effectiveArr := (stop.ContinuousArr + delay) % 1440
		effectiveDep := (stop.ContinuousDep + delay) % 1440

		// Difference relative to target clock minute
		diff := effectiveArr - targetMin
		// Handle 24-hour wrap
		if diff < -720 {
			diff += 1440
		} else if diff > 720 {
			diff -= 1440
		}

		// Filter to [-30 min, +120 min]
		if diff < -30 || diff > 120 {
			continue
		}

		origin := train.Stops[0].StationName
		dest := train.Stops[len(train.Stops)-1].StationName

		status := "ON_TIME"
		if delay > 15 {
			status = "DELAYED"
		}

		// Passing / At Platform: [-10 min, +15 min]
		isPassingNow := diff >= -10 && diff <= 15
		if isPassingNow {
			if targetMin >= effectiveArr && targetMin <= effectiveDep {
				status = "AT_PLATFORM"
			} else if diff < 0 {
				status = "DEPARTING"
			} else {
				status = "APPROACHING"
			}
		}

		bTrain := BoardTrain{
			TrainNumber:        train.Number,
			TrainName:          train.Name,
			Platform:           stop.Platform,
			ScheduledArrival:   formatMinutes(stop.ContinuousArr),
			ScheduledDeparture: formatMinutes(stop.ContinuousDep),
			ExpectedArrival:    formatMinutes(stop.ContinuousArr + delay),
			ExpectedDeparture:  formatMinutes(stop.ContinuousDep + delay),
			DelayMin:           delay,
			Status:             status,
			TimeDiffMin:        diff,
			Origin:             origin,
			Destination:        dest,
			Coaches:            generateRakeLayout(train.Number),
		}

		if isPassingNow {
			passingNow = append(passingNow, bTrain)
		} else if diff > 15 && diff <= 120 {
			upcoming = append(upcoming, bTrain)
		}
	}

	sort.Slice(passingNow, func(i, j int) bool {
		return passingNow[i].TimeDiffMin < passingNow[j].TimeDiffMin
	})

	sort.Slice(upcoming, func(i, j int) bool {
		return upcoming[i].TimeDiffMin < upcoming[j].TimeDiffMin
	})

	resp := map[string]interface{}{
		"station": map[string]interface{}{
			"code":   st.Code,
			"name":   st.Name,
			"is_hub": st.IsHub,
		},
		"query_time":  formatMinutes(targetMin),
		"passing_now": passingNow,
		"upcoming":    upcoming,
	}

	json.NewEncoder(w).Encode(resp)
}

func main() {
	// Read DB connection from environment variable (set in Railway dashboard)
	// Falls back to local dev connection string if not set
	dbConnStr := os.Getenv("DATABASE_URL")
	if dbConnStr == "" {
		dbConnStr = "postgres://postgres:0912@localhost:5432/railhop?sslmode=disable"
		log.Println("DATABASE_URL not set — using local development database")
	} else {
		log.Println("Using DATABASE_URL from environment")
	}

	db, err := sql.Open("postgres", dbConnStr)
	if err != nil {
		log.Fatalf("Failed to open postgres connection: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping postgres: %v", err)
	}
	log.Println("PostgreSQL connection confirmed.")

	// Load graph
	g, err := loadGraph(db)
	if err != nil {
		log.Fatalf("Failed to load railway graph: %v", err)
	}
	railGraph = g

	// Register Routes
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", enableCORS(handleHealthz))
	mux.HandleFunc("/api/v1/stations/search", enableCORS(handleStationSearch))
	mux.HandleFunc("/api/v1/routes/search", enableCORS(handleRouteSearch))
	mux.HandleFunc("/api/v1/trains/live", enableCORS(handleTrainLive))
	mux.HandleFunc("/api/v1/trains/ping", enableCORS(handleTrainPing))
	mux.HandleFunc("/api/v1/stations/live-board", enableCORS(handleStationLiveBoard))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if !strings.HasPrefix(port, ":") {
		port = ":" + port
	}

	server := &http.Server{
		Addr:         port,
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	log.Printf("Railtracker Backend microservice listening on http://localhost%s", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server ListenAndServe error: %v", err)
	}
}
