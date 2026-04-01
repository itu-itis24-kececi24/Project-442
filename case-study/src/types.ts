export interface Entity {
  id: string;
  type: 'sheep' | 'ugv' | 'uav' | 'predator';
  x: number;
  y: number;
  status?: string;
  battery?: number;
  isLeader?: boolean;
  stressLevel?: number;
  heading?: number;
  baseX?: number; // Added to anchor wandering
  baseY?: number; // Added to anchor wandering
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface EnvironmentalData {
  temp: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
}