import { useState, useEffect } from 'react';
import { SensorType } from '@/types/sensor';
import { queryInfluxDB, parseInfluxCSV, buildFluxQuery, influxConfig } from '@/lib/influxdb';

export function useSensorData(
  metric: SensorType, 
  updateInterval: number = 5000,
  buildingTag?: string
) {
  const [value, setValue] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const query = buildFluxQuery(
          influxConfig.bucket,
          'alldata',
          metric,
          '-2h',
          buildingTag
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

    fetchData();
    const interval = setInterval(fetchData, updateInterval);
    
    return () => clearInterval(interval);
  }, [metric, updateInterval, buildingTag]);

  return { value, lastUpdate, error };
}