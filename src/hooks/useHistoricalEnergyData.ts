import { useState, useEffect } from 'react';

export type EnergyCalculationType = 'cumulative' | 'rate' | 'normalized';

interface DataPoint {
  timestamp: string;
  value: number;
}

export function useHistoricalEnergyData(
  buildingId: string,
  timeRange: string = '-24h',
  interval: string = '15m',
  deviceId?: string,
  calculationType: EnergyCalculationType = 'cumulative',
  stopTime?: string
) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) {
      console.log('useHistoricalEnergyData: no deviceId provided for building', buildingId);
      setData([]);
      setLoading(false);
      return;
    }

    async function fetchHistoricalData() {
      if (!deviceId) return;
      setLoading(true);
      
      try {
        const params = new URLSearchParams({
          buildingId,
          timeRange,
          interval,
          deviceId,
          calculationType
        });
        if (stopTime) params.set('stopTime', stopTime);

        const response = await fetch(`/api/historical-energy?${params}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch');
        }

        console.log('useHistoricalEnergyData parsed points:', result.data.length, { buildingId, deviceId });
        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching historical energy data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistoricalData();
  }, [buildingId, timeRange, interval, deviceId, calculationType, stopTime]);

  return { data, loading, error };
}