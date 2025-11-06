import { useState, useEffect } from 'react';
import { queryInfluxDB, buildHistoricalFluxQuery, influxConfig } from '@/lib/influxdb';

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
        const field = metric === 'temperature' ? 'temperature' : 'humidity';
        
        const query = buildHistoricalFluxQuery(
          influxConfig.bucket,
          'alldata',
          field,
          timeRange,
          interval,
          deviceId,
          stopTime
        );

        const csvData = await queryInfluxDB(query);
        const parsed = parseHistoricalCSV(csvData);
        
        setData(parsed);
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

function parseHistoricalCSV(csv: string): DataPoint[] {
  const lines = csv.trim().split('\n');
  const dataPoints: DataPoint[] = [];
  
  const dataLines = lines.filter(line => 
    !line.startsWith('#') && 
    !line.startsWith(',result,') &&
    line.trim() !== ''
  );

  for (const line of dataLines) {
    const values = line.split(',');
    
    if (values.length > 6) {
      const timestamp = values[5];
      const value = parseFloat(values[6]);
      
      if (!isNaN(value) && timestamp) {
        // Return ISO timestamp for better processing
        dataPoints.push({
          timestamp: timestamp,
          value: value
        });
      }
    }
  }

  return dataPoints;
}