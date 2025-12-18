import { useState, useEffect } from 'react';

export type EnergyCalculationType = 'cumulative' | 'power' | 'normalized';

export function useEnergyData(
  buildingId: string,
  deviceId?: string,
  updateInterval: number = 30000,
  calculationType: EnergyCalculationType = 'cumulative'
) {
  const [value, setValue] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) {
      setValue(null);
      return;
    }

    async function fetchData() {
      if (!deviceId) return;
      
      try {
        const params = new URLSearchParams({
          buildingId,
          deviceId,
          calculationType
        });

        const response = await fetch(`/api/energy?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch');
        }

        setValue(data.value);
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching energy data:', err);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, updateInterval);

    return () => clearInterval(interval);
  }, [buildingId, deviceId, updateInterval, calculationType]);

  return { value, lastUpdate, error };
}