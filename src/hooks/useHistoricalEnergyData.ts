import { useState, useEffect } from 'react';
import { queryInfluxDB, buildHistoricalFluxQuery, buildHistoricalRateFluxQuery, influxConfig } from '@/lib/influxdb';
import { getDeviceConversionFactor, getBuildingById, gas_kWh_L, oil_kWh_L, getDeviceById } from '@/lib/buildings';

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
      // DEBUG: log missing device id so we can see why hook exits early
      console.log('useHistoricalEnergyData: no deviceId provided for building', buildingId);
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
        
        // DEBUG: show parsed raw points length
        console.log('useHistoricalEnergyData parsed points:', parsed.length, { buildingId, deviceId });
        
        // Determine conversion factor with fallbacks:
        // 1) helper getDeviceConversionFactor (may return undefined)
        // 2) device.conversionFactor stored on device object
        // 3) energyType → global constants (oil_kWh_L / gas_kWh_L)
        // 4) final fallback 1
        let conversionFactor = getDeviceConversionFactor(buildingId, deviceId);
        const deviceObj = getDeviceById(buildingId, deviceId) ?? getBuildingById(buildingId)?.devices?.find(d => d.deviceId === deviceId);
        if (!conversionFactor || conversionFactor === 0) {
          conversionFactor = deviceObj?.conversionFactor ?? (deviceObj?.energyType === 'oil' ? oil_kWh_L : deviceObj?.energyType === 'gas' ? gas_kWh_L : 1);
        }
        console.log('useHistoricalEnergyData conversion lookup:', { buildingId, deviceId, deviceObj, conversionFactor });

        const convertedData = parsed.map(point => ({
          timestamp: point.timestamp,
          value: point.value * conversionFactor
        }));
        
        // If normalized, divide by building area
        if (calculationType === 'normalized') {
          const building = getBuildingById(buildingId);
          if (building && building.area > 0) {
            // convert to kWh/m²
            const normalized = convertedData.map(point => ({
              timestamp: point.timestamp,
              value: point.value / building.area
            }));
            // overwrite convertedData to normalized
            convertedData.splice(0, convertedData.length, ...normalized);
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