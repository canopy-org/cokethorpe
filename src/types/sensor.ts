export type SensorType = 'temperature' | 'humidity' | 'energy' | 'battery' | 'power';

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
  energy: number | null;
  battery: number | null;

}