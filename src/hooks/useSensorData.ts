import { useState, useEffect } from 'react';
import { SensorType } from '@/types/sensor';

export function useSensorData(
  metric: SensorType,
  updateInterval: number = 30000,
  deviceId?: string
) {
  const [value, setValue] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams({ metric });
        if (deviceId) params.set('deviceId', deviceId);

        const response = await fetch(`/api/sensors?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch');
        }

        setValue(data.value);
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching sensor data:', err);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, updateInterval);

    return () => clearInterval(interval);
  }, [metric, updateInterval, deviceId]);

  return { value, lastUpdate, error };
}