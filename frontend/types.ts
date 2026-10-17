export interface Station {
  code: string;
  name: string;
  is_hub: boolean;
}

export interface RouteLeg {
  train_number: string;
  train_name: string;
  from_code: string;
  from_name: string;
  to_code: string;
  to_name: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  duration_formatted: string;
  stops_count: number;
  departure_platform: number;
  arrival_platform: number;
}

export interface LayoverInfo {
  hub_code: string;
  hub_name: string;
  arrival_time: string;
  departure_time: string;
  layover_minutes: number;
  layover_formatted: string;
  arrival_platform: number;
  departure_platform: number;
  buffer_minutes: number;
  interchange_walk_minutes: number;
}

export interface RouteOption {
  id: string;
  transfers: number;
  total_duration_minutes: number;
  total_duration_formatted: string;
  departure_time: string;
  arrival_time: string;
  reliability_score: number;
  reliability_rating: "HIGH" | "MEDIUM" | "LOW" | "RISKY";
  interchange_guidance: string;
  legs: RouteLeg[];
  layover?: LayoverInfo;
}

export interface RouteSearchResponse {
  from: { code: string; name: string };
  to: { code: string; name: string };
  date: string;
  total_count: number;
  limit: number;
  routes: RouteOption[];
}

export interface LiveTimelineStop {
  stop_sequence: number;
  station_code: string;
  station_name: string;
  scheduled_arrival: string;
  scheduled_departure: string;
  expected_arrival: string;
  expected_departure: string;
  halt_duration_minutes: number;
  status: "DEPARTED" | "CURRENT" | "UPCOMING";
  delay_minutes: number;
  platform: number;
  distance_km: number;
}

export interface LiveTrainResponse {
  train_number: string;
  train_name: string;
  status: "NOT_STARTED" | "IN_TRANSIT" | "HALTED_AT_STATION" | "COMPLETED";
  current_station: { code: string; name: string; platform: number };
  next_station: { code: string; name: string; platform: number };
  progress_percent: number;
  estimated_speed_kmph: number;
  delay_min: number;
  crowdsourced: boolean;
  last_ping_time?: string;
  timeline: LiveTimelineStop[];
}

export interface TrainPing {
  trainNumber: string;
  currentStation: string;
  delayMin: number;
  speedKmph: number;
}

export interface CoachInfo {
  id: string;
  type: string;
  pillar: string;
  vacant_berths: number;
  occupancy: number;
  class_code: string;
}

export interface BoardTrain {
  train_number: string;
  train_name: string;
  platform: number;
  scheduled_arrival: string;
  scheduled_departure: string;
  expected_arrival: string;
  expected_departure: string;
  delay_min: number;
  status: "AT_PLATFORM" | "PASSING" | "APPROACHING" | "DEPARTING" | "ON_TIME" | "DELAYED";
  time_diff_min: number;
  origin: string;
  destination: string;
  coaches: CoachInfo[];
}

export interface StationLiveBoardResponse {
  station: { code: string; name: string; is_hub: boolean };
  query_time: string;
  passing_now: BoardTrain[];
  upcoming: BoardTrain[];
}
