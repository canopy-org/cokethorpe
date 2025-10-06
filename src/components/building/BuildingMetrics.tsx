'use client';

import { useSensorData } from '@/hooks/useSensorData';
import { getColorForMetric } from '@/lib/utils';
import { getPrimarySensorDevice } from '@/lib/buildings';

interface MetricCardProps {
  title: string;
  value: number | null;
  unit: string;
  color?: string;
}

function MetricCard({ title, value, unit, color }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4" style={{ borderLeftColor: color || '#95a5a6' }}>
      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</h3>
      <p className="text-4xl font-bold mt-3" style={{ color: color || '#333' }}>
        {value !== null ? value.toFixed(1) : '--'}
        <span className="text-xl ml-1">{unit}</span>
      </p>
    </div>
  );
}

interface BuildingMetricsProps {
  buildingId: string;

}

export default function BuildingMetrics({ buildingId }: BuildingMetricsProps) {
  const tempDeviceId = getPrimarySensorDevice(buildingId, 'temperature');
  const humidityDeviceId = getPrimarySensorDevice(buildingId, 'humidity');
  const batteryDeviceId = getPrimarySensorDevice(buildingId, 'battery');
  const pulseDeviceId = getPrimarySensorDevice(buildingId, 'water');

  const { value: temperature } = useSensorData('temperature', 5000, tempDeviceId);
  const { value: humidity } = useSensorData('humidity', 5000, humidityDeviceId);
  const { value: battery } = useSensorData('battery', 5000, batteryDeviceId);
  const { value: water } = useSensorData('water', 5000, pulseDeviceId);
 

  // Build array of metrics to display (only show if device exists)
  const metrics = [];
  
  if (tempDeviceId) {
    metrics.push({
      title: 'Temperature',
      value: temperature,
      unit: '°C',
      color: temperature !== null ? getColorForMetric(temperature, 'temperature') : undefined
    });
  }
  
  if (humidityDeviceId) {
    metrics.push({
      title: 'Humidity',
      value: humidity,
      unit: '%',
      color: humidity !== null ? getColorForMetric(humidity, 'humidity') : undefined
    });
  }
  
  if (pulseDeviceId) {
    metrics.push({
      title: 'Gas Usage',
      value: water,
      unit: 'kWh',
      color: water !== null ? getColorForMetric(water, 'water') : undefined
    });
  }
  
  if (batteryDeviceId) {
    metrics.push({
      title: 'Battery',
      value: battery,
      unit: '%',
      color: battery !== null ? getColorForMetric(battery, 'battery') : undefined
    });
  }

  // Determine grid columns based on number of metrics
  const gridCols = metrics.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 
                   metrics.length === 3 ? 'md:grid-cols-3' :
                   metrics.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1';

  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-6 mb-8`}>
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}