import { useState, useEffect } from 'react';
import { SensorType } from '@/types/sensor';
import { queryInfluxDB, buildHistoricalFluxQuery, influxConfig } from '@/lib/influxdb';

interface DataPoint {
  timestamp: string;
  value: number;
}

export function useHistoricalData(
  metric: SensorType, 
  timeRange: string = '-24h',
  interval: string = '15m',
  buildingTag?: string
) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistoricalData() {
      setLoading(true);
      try {
        const query = buildHistoricalFluxQuery(
          influxConfig.bucket,
          'alldata',
          metric,
          timeRange,
          interval,
          buildingTag
        );

        const csvData = await queryInfluxDB(query);
        const parsed = parseHistoricalCSV(csvData, timeRange);
        
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
  }, [metric, timeRange, interval, buildingTag]);

  return { data, loading, error };
}

function parseHistoricalCSV(csv: string, timeRange: string): DataPoint[] {
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
        const date = new Date(timestamp);
        
        let formattedTime: string;
        if (timeRange.includes('h')) {
          formattedTime = date.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
        } else {
          formattedTime = date.toLocaleDateString('en-GB', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        
        dataPoints.push({
          timestamp: formattedTime,
          value: value
        });
      }
    }
  }

  return dataPoints;
}