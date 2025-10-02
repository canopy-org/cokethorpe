import { SensorType } from '@/types/sensor';

export function getTemperatureColor(temp: number): string {
  if (temp < 15) return '#3498db';    // Cold - Blue
  if (temp < 18) return '#2ecc71';    // Good - Green
  if (temp < 21) return '#f39c12';    // Warm - Amber/Orange
  return '#e74c3c';                   // Hot - Red
}

export function getHumidityColor(humidity: number): string {
  if (humidity < 30) return '#e74c3c';    // Too dry - Red
  if (humidity < 40) return '#f39c12';    // Low - Amber
  if (humidity < 60) return '#2ecc71';    // Good - Green
  if (humidity < 70) return '#f39c12';    // High - Amber
  return '#3498db';                       // Too humid - Blue
}

export function getBatteryColor(battery: number): string {
  if (battery < 20) return '#e74c3c';     // Critical - Red
  if (battery < 40) return '#f39c12';     // Low - Amber
  if (battery < 80) return '#2ecc71';     // Good - Green
  return '#27ae60';                       // Full - Dark Green
}

export function getColorForMetric(value: number, metric: SensorType): string {
  switch(metric) {
    case 'temperature':
      return getTemperatureColor(value);
    case 'humidity':
      return getHumidityColor(value);
    case 'battery':
      return getBatteryColor(value);
    default:
      return '#95a5a6';
  }
}

export function getUnitForMetric(metric: SensorType): string {
  switch(metric) {
    case 'temperature':
      return '°C';
    case 'humidity':
    case 'battery':
      return '%';
    default:
      return '';
  }
}