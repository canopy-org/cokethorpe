'use client';

import { useSensorData } from '@/hooks/useSensorData';
import { getColorForMetric } from '@/lib/utils';

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

export default function BuildingMetrics() {
  const { value: temperature } = useSensorData('temperature');
  const { value: humidity } = useSensorData('humidity');
  const { value: battery } = useSensorData('battery');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <MetricCard
        title="Temperature"
        value={temperature}
        unit="°C"
        color={temperature !== null ? getColorForMetric(temperature, 'temperature') : undefined}
      />
      <MetricCard
        title="Humidity"
        value={humidity}
        unit="%"
        color={humidity !== null ? getColorForMetric(humidity, 'humidity') : undefined}
      />
      <MetricCard
        title="Battery"
        value={battery}
        unit="%"
        color={battery !== null ? getColorForMetric(battery, 'battery') : undefined}
      />
    </div>
  );
}