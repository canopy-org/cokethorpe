export type SensorType = 'temperature' | 'humidity' | 'battery' | 'water' | 'water_conv';

export interface SensorReading {
  buildingId: string;
  deviceId: string;
  timestamp: Date;
  value: number;
  sensorType: SensorType;
}

export interface BuildingMetrics {
  temperature: number | null;
  humidity: number | null;
  battery: number | null;
  water: number | null;
  water_conv: number | null;
}