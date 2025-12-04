import { useState, useEffect } from 'react';

interface DataPoint {
  timestamp: string;
  value: number;
}

export function useHistoricalData(
  metric: 'temperature' | 'humidity',
  timeRange: string = '-24h',
  interval: string = '15m',
  deviceId?: string,
  stopTime?: string
) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) {
      setData([]);
      setLoading(false);
      return;
    }

    async function fetchHistoricalData() {
      if (!deviceId) return;
      setLoading(true);
      
      try {
        const params = new URLSearchParams({
          metric,
          timeRange,
          interval,
          deviceId
        });
        if (stopTime) params.set('stopTime', stopTime);

        const response = await fetch(`/api/historical?${params}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch');
        }

        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching historical data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistoricalData();
  }, [metric, timeRange, interval, deviceId, stopTime]);

  return { data, loading, error };
}