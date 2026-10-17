import axios from "axios";
import {
  Station,
  RouteSearchResponse,
  LiveTrainResponse,
  TrainPing,
  StationLiveBoardResponse,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";


export const api = {
  // Search stations by code or name
  searchStations: async (q: string): Promise<Station[]> => {
    if (!q.trim()) return [];
    const res = await axios.get<Station[]>(`${API_BASE}/api/v1/stations/search`, {
      params: { q },
    });
    return res.data || [];
  },

  // Search routes (default limit = 0 -> unlimited)
  searchRoutes: async (
    from: string,
    to: string,
    date?: string,
    limit: number = 0
  ): Promise<RouteSearchResponse> => {
    const res = await axios.get<RouteSearchResponse>(`${API_BASE}/api/v1/routes/search`, {
      params: {
        from,
        to,
        date: date || new Date().toISOString().split("T")[0],
        limit,
      },
    });
    return res.data;
  },

  // Live tracking for a train
  getTrainLive: async (trainNumber: string): Promise<LiveTrainResponse> => {
    const res = await axios.get<LiveTrainResponse>(`${API_BASE}/api/v1/trains/live`, {
      params: { number: trainNumber },
    });
    return res.data;
  },

  // Submit crowdsource ping
  pingTrain: async (ping: TrainPing): Promise<{ status: string; message: string }> => {
    const res = await axios.post(`${API_BASE}/api/v1/trains/ping`, ping);
    return res.data;
  },

  // Live station departures / arrivals
  getStationLiveBoard: async (
    station: string,
    time?: string
  ): Promise<StationLiveBoardResponse> => {
    const res = await axios.get<StationLiveBoardResponse>(
      `${API_BASE}/api/v1/stations/live-board`,
      {
        params: { station, time },
      }
    );
    return res.data;
  },

  // Health check
  getHealth: async (): Promise<{ status: string; stations: number; trains: number }> => {
    const res = await axios.get(`${API_BASE}/healthz`);
    return res.data;
  },
};
