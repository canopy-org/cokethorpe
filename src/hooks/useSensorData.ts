import { useState, useEffect } from 'react';
import { SensorType } from '@/types/sensor';
import { queryInfluxDB, parseInfluxCSV, buildFluxQuery, influxConfig } from '@/lib/influxdb';

export function useSensorData(metric: SensorType, updateInterval: number = 5000) {
  const [value, setValue] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const query = buildFluxQuery(
          influxConfig.bucket,
          'alldata',
          metric
        );

        const csvData = await queryInfluxDB(query);
        const parsedValue = parseInfluxCSV(csvData);
        
        setValue(parsedValue);
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching sensor data:', err);
      }
    }

    // Initial fetch
    fetchData();
    
    // Set up interval
    const interval = setInterval(fetchData, updateInterval);
    
    // Cleanup
    return () => clearInterval(interval);
  }, [metric, updateInterval]);

  return { value, lastUpdate, error };
}