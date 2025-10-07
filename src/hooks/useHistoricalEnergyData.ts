import { useState, useEffect } from 'react';
import { queryInfluxDB, buildHistoricalFluxQuery, buildHistoricalRateFluxQuery, influxConfig } from '@/lib/influxdb';
import { getDeviceConversionFactor, getBuildingById } from '@/lib/buildings';

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
  calculationType: EnergyCalculationType = 'cumulative'
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
        let query: string;
        
        if (calculationType === 'rate') {
          // For rate calculation, use difference between readings
          query = buildHistoricalRateFluxQuery(
            influxConfig.bucket,
            'alldata',
            'water',
            timeRange,
            interval,
            deviceId
          );
        } else {
          // For cumulative and normalized, use mean aggregation
          query = buildHistoricalFluxQuery(
            influxConfig.bucket,
            'alldata',
            'water',
            timeRange,
            interval,
            deviceId
          );
        }

        const csvData = await queryInfluxDB(query);
        const parsed = parseHistoricalCSV(csvData, timeRange);
        
        // Convert all values using conversion factor
        const conversionFactor = getDeviceConversionFactor(buildingId, deviceId);
        let convertedData = parsed.map(point => ({
          timestamp: point.timestamp,
          value: point.value * conversionFactor
        }));
        
        // If normalized, divide by building area
        if (calculationType === 'normalized') {
          const building = getBuildingById(buildingId);
          if (building && building.area > 0) {
            convertedData = convertedData.map(point => ({
              timestamp: point.timestamp,
              value: point.value / building.area
            }));
          }
        }
        
        setData(convertedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching historical energy data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistoricalData();
  }, [buildingId, timeRange, interval, deviceId, calculationType]);

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