'use client';

import { useState } from 'react';
import TimeSeriesChart from '@/components/charts/TimeSeriesChart';
import DateRangePicker from '@/components/charts/DateRangePicker';
import { useHistoricalData } from '@/hooks/useHistoricalData';

export default function BuildingCharts() {
  const [timeRange, setTimeRange] = useState('-24h');

  // Calculate appropriate interval based on time range
  const getInterval = (range: string): string => {
    if (range === '-1h') return '1m';
    if (range === '-6h') return '5m';
    if (range === '-24h') return '15m';
    if (range === '-7d') return '1h';
    if (range === '-30d') return '6h';
    return '1d'; // For 90 days
  };

  const interval = getInterval(timeRange);

  const { data: tempData, loading: tempLoading } = useHistoricalData('temperature', timeRange, interval);
  const { data: humidityData, loading: humidityLoading } = useHistoricalData('humidity', timeRange, interval);
  const { data: batteryData, loading: batteryLoading } = useHistoricalData('battery', timeRange, interval);

  return (
    <div>
      {/* Date Range Picker */}
      <DateRangePicker value={timeRange} onChange={setTimeRange} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <TimeSeriesChart
            data={tempData}
            title={`Temperature (${timeRange.replace('-', 'Last ')})`}
            unit="°C"
            color="#e74c3c"
            loading={tempLoading}
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <TimeSeriesChart
            data={humidityData}
            title={`Humidity (${timeRange.replace('-', 'Last ')})`}
            unit="%"
            color="#3498db"
            loading={humidityLoading}
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
          <TimeSeriesChart
            data={batteryData}
            title={`Battery Level (${timeRange.replace('-', 'Last ')})`}
            unit="%"
            color="#2ecc71"
            loading={batteryLoading}
          />
        </div>
      </div>
    </div>
  );
}