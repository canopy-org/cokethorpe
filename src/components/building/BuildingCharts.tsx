'use client';

import { useState } from 'react';
import TimeSeriesChart from '@/components/charts/TimeSeriesChart';
import DateRangePicker from '@/components/charts/DateRangePicker';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useHistoricalEnergyData } from '@/hooks/useHistoricalEnergyData';
import { getPrimarySensorDevice } from '@/lib/buildings';

interface BuildingChartsProps {
  buildingId: string;
}

export default function BuildingCharts({ buildingId }: BuildingChartsProps) {
  const [timeRange, setTimeRange] = useState('-24h');

  const getInterval = (range: string): string => {
    if (range === '-1h') return '1m';
    if (range === '-6h') return '5m';
    if (range === '-24h') return '15m';
    if (range === '-7d') return '1h';
    if (range === '-30d') return '6h';
    return '1d';
  };

  const interval = getInterval(timeRange);

  const tempDeviceId = getPrimarySensorDevice(buildingId, 'temperature');
  const humidityDeviceId = getPrimarySensorDevice(buildingId, 'humidity');
  const energyDeviceId = getPrimarySensorDevice(buildingId, 'energy');

  const { data: tempData, loading: tempLoading } = useHistoricalData('temperature', timeRange, interval, tempDeviceId);
  const { data: humidityData, loading: humidityLoading } = useHistoricalData('humidity', timeRange, interval, humidityDeviceId);
  const { data: energyData, loading: energyLoading } = useHistoricalEnergyData(buildingId, timeRange, interval, energyDeviceId);

  return (
    <div>
      <DateRangePicker value={timeRange} onChange={setTimeRange} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tempDeviceId && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <TimeSeriesChart
              data={tempData}
              title={`Temperature (${timeRange.replace('-', 'Last ')})`}
              unit="°C"
              color="#e74c3c"
              loading={tempLoading}
            />
          </div>
        )}

        {humidityDeviceId && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <TimeSeriesChart
              data={humidityData}
              title={`Humidity (${timeRange.replace('-', 'Last ')})`}
              unit="%"
              color="#3498db"
              loading={humidityLoading}
            />
          </div>
        )}

        {energyDeviceId && (
          <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
            <TimeSeriesChart
              data={energyData}
              title={`Energy Usage (${timeRange.replace('-', 'Last ')})`}
              unit="kWh"
              color="#f39c12"
              loading={energyLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}