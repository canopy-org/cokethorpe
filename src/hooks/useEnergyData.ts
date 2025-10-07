import { useState, useEffect } from 'react';
import { queryInfluxDB, parseInfluxCSV, buildFluxQuery, influxConfig } from '@/lib/influxdb';
import { getDeviceConversionFactor } from '@/lib/buildings';

export function useEnergyData(
  buildingId: string,
  deviceId?: string,
  updateInterval: number = 5000
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
        // Query the 'water' field from InfluxDB (pulse count)
        const query = buildFluxQuery(
          influxConfig.bucket,
          'alldata',
          'water',  // Query 'water' field from InfluxDB
          '-2h',
          deviceId
        );

        const csvData = await queryInfluxDB(query);
        const pulseValue = parseInfluxCSV(csvData);
        
        if (pulseValue !== null) {
          // Convert pulses to energy using device-specific conversion factor
          const conversionFactor = getDeviceConversionFactor(buildingId, deviceId);
          const energyValue = pulseValue * conversionFactor;
          setValue(energyValue);
        } else {
          setValue(null);
        }
        
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
  }, [buildingId, deviceId, updateInterval]);

  return { value, lastUpdate, error };
}