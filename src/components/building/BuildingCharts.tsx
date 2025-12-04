'use client';

import { useState } from 'react';
import DateRangePicker from '@/components/charts/DateRangePicker';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useHistoricalEnergyData } from '@/hooks/useHistoricalEnergyData';
import { getPrimarySensorDevice } from '@/lib/buildings';
import MultiMetricChart from '@/components/charts/MultiMetricChart';
import { getBuildingById, siteConfig } from '@/lib/buildings';
import EnergySignatureChart from '@/components/charts/EnergySignatureChart'; 
import ThermalCharacteristicsPanel from '@/components/building/ThermalCharacteristicsPanel';

interface BuildingChartsProps {
  buildingId: string;
  floorArea?: number; // Add floor area for U-value calculation
}

export default function BuildingCharts({ buildingId, floorArea }: BuildingChartsProps) {
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [aggregation, setAggregation] = useState<'hourly' | 'daily' | 'monthly'>('hourly');

  // Thermal model date range (default: last 14 days)
  const [thermalEndDate] = useState(() => new Date());
  const [thermalStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 14);
    return date;
  });

  // Update date format when period changes
  const handlePeriodChange = (newPeriod: 'day' | 'month' | 'year') => {
    setPeriod(newPeriod);
    
    const today = new Date();
    if (newPeriod === 'day') {
      setDate(today.toISOString().split('T')[0]); // YYYY-MM-DD
      setAggregation('hourly'); // Reset to hourly for day view
    } else if (newPeriod === 'month') {
      setDate(today.toISOString().slice(0, 7)); // YYYY-MM
      if (aggregation === 'monthly') {
        setAggregation('daily'); // Switch away from monthly
      }
    } else {
      setDate(today.getFullYear().toString()); // YYYY
      // Keep current aggregation as all are valid for year
    }
  };

  // Get device IDs
  const tempDeviceId = getPrimarySensorDevice(buildingId, 'temperature');
  const humidityDeviceId = getPrimarySensorDevice(buildingId, 'humidity');
  const energyDeviceId = getPrimarySensorDevice(buildingId, 'energy');

  // Fetch OAT data
  const oatDeviceId = siteConfig.oatSensorDeviceId;


  // Calculate time range
  const getTimeRangeAndInterval = () => {
    let startDate: Date;
    let endDate: Date;
    let interval: string;

    let formattedDate = date;
    if (period === 'day') {
      if (date.length === 7) formattedDate = `${date}-01`;
      else if (date.length === 4) formattedDate = `${date}-01-01`;
    } else if (period === 'month') {
      if (date.length === 10) formattedDate = date.slice(0, 7);
      else if (date.length === 4) formattedDate = `${date}-01`;
    } else {
      if (date.length === 10) formattedDate = date.slice(0, 4);
      else if (date.length === 7) formattedDate = date.slice(0, 4);
    }

    if (period === 'day') {
      startDate = new Date(formattedDate + 'T00:00:00Z');
      endDate = new Date(formattedDate + 'T23:59:59Z');
      interval = aggregation === 'hourly' ? '1h' : '1d';
    } else if (period === 'month') {
      const [year, month] = formattedDate.split('-').map(Number);
      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
      interval = aggregation === 'hourly' ? '1h' : aggregation === 'daily' ? '1d' : '1d';
    } else {
      const year = parseInt(formattedDate);
      startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
      interval = aggregation === 'hourly' ? '1h' : aggregation === 'daily' ? '1d' : '1M';
    }

    return { startDate, endDate, interval };
  };

  const { startDate, endDate, interval } = getTimeRangeAndInterval();
  const startTime = startDate.toISOString();
  const stopTime = endDate.toISOString();

  // Fetch data for historical charts
  const { data: tempData, loading: tempLoading } = useHistoricalData('temperature', startTime, interval, tempDeviceId, stopTime);
  const { data: humidityData, loading: humidityLoading } = useHistoricalData('humidity', startTime, interval, humidityDeviceId, stopTime);
  const { data: oatData, loading: oatLoading } = useHistoricalData('temperature', startTime, interval, oatDeviceId, stopTime);
  const { data: energyData, loading: energyLoading } = useHistoricalEnergyData(
    buildingId, 
    startTime, 
    interval, 
    energyDeviceId,
    'rate',
    stopTime
  );
  
  const loading = tempLoading || humidityLoading || energyLoading;

  // Determine if showing power or energy
  const isPower = aggregation === 'hourly';
  const energyLabel = isPower ? 'Power' : 'Energy';
  const energyUnit = isPower ? 'kW' : 'kWh';

  // Build metrics configuration for historical chart
  const metrics = [
    {
      name: 'Indoor Temperature',
      data: tempData,
      unit: '°C',
      color: '#e74c3c',
      position: 'left' as const,
      alwaysLine: true,
      axisId: 'temperature'  // Add this
    },
    {
      name: 'Humidity',
      data: humidityData,
      unit: '%',
      color: '#3498db',
      position: 'right' as const,
      alwaysLine: true
    },
    {
      name: energyLabel,
      data: energyData,
      unit: energyUnit,
      color: '#f39c12',
      position: 'right' as const,
      chartType: 'auto' as const
    },
    {
      name: 'Outdoor Temperature',
      data: oatData,
      unit: '°C',
      color: '#0cc21b',
      position: 'left' as const,
      alwaysLine: true,
      axisId: 'temperature'  // Add this
    }
  ];

 return (
    <div className="space-y-6">
      {/* Historical Data Chart */}
      <div>
        <DateRangePicker 
          period={period}
          date={date}
          aggregation={aggregation}
          onPeriodChange={handlePeriodChange}
          onDateChange={setDate}
          onAggregationChange={setAggregation}
        />

        <div className="bg-white rounded-lg shadow-lg p-6">
          <MultiMetricChart
            title="Building Metrics"
            metrics={metrics}
            period={period}
            date={date}
            aggregation={aggregation}
            loading={loading}
            height={500}
          />
        </div>
      </div>

      {/* Energy Signature Chart */}
      <EnergySignatureChart buildingId={buildingId} />
      {/* Thermal Characteristics Panel */}
      <ThermalCharacteristicsPanel buildingId={buildingId} />
    </div>
  );
}