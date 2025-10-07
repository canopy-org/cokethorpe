import { SensorType } from '@/types/sensor';

export function getTemperatureColor(temp: number): string {
  if (temp < 15) return 'rgba(52, 152, 219, 0.7)';    // Cold - Blue
  if (temp < 18) return 'rgba(46, 204, 113, 0.7)';    // Good - Green
  if (temp < 21) return 'rgba(243, 156, 18, 0.7)';    // Warm - Amber/Orange
  return 'rgba(231, 76, 60, 0.7)';                    // Hot - Red
}

export function getHumidityColor(humidity: number): string {
  if (humidity < 30) return 'rgba(231, 76, 60, 0.7)';    // Too dry - Red
  if (humidity < 40) return 'rgba(243, 156, 18, 0.7)';   // Low - Amber
  if (humidity < 60) return 'rgba(46, 204, 113, 0.7)';   // Good - Green
  if (humidity < 70) return 'rgba(243, 156, 18, 0.7)';   // High - Amber
  return 'rgba(52, 152, 219, 0.7)';                      // Too humid - Blue
}

export function getEnergyColor(energy: number): string {
  if (energy > 150) return 'rgba(231, 76, 60, 0.7)';     // Critical - Red
  if (energy > 100) return 'rgba(243, 156, 18, 0.7)';    // Low - Amber
  if (energy > 70) return 'rgba(46, 204, 113, 0.7)';    // Good - Green
  return 'rgba(39, 174, 96, 0.7)';                       // Full - Dark Green
}

export function getColorForMetric(value: number, metric: SensorType): string {
  switch(metric) {
    case 'temperature':
      return getTemperatureColor(value);
    case 'humidity':
      return getHumidityColor(value);
    case 'energy':
      return getEnergyColor(value);
    default:
      return 'rgba(149, 165, 166, 0.5)';
  }
}

export function getUnitForMetric(metric: SensorType): string {
  switch(metric) {
    case 'temperature':
      return '°C';
    case 'humidity':
    case 'energy':
      return 'kWh';
    default:
      return '';
  }
}