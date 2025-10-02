export type SensorType = 'temperature' | 'humidity' | 'battery';

export interface SensorReading {
  buildingId: string;
  timestamp: Date;
  value: number;
  sensorType: SensorType;
}

export interface BuildingMetrics {
  temperature: number | null;
  humidity: number | null;
  battery: number | null;
}