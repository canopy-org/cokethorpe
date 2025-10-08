import { useState, useEffect } from 'react';
import { queryInfluxDB, buildHistoricalRateFluxQuery, influxConfig } from '@/lib/influxdb';
import { getAllGasDevices, getSiteElectricityDevice } from '@/lib/buildings';

export interface SiteEnergyData {
  totalGas: number | null;
  totalElectricity: number | null;
  buildingBreakdown: {
    buildingId: string;
    buildingName: string;
    gasUsage: number | null;
  }[];
}

interface DataPoint {
  timestamp: string;
  value: number;
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
        dataPoints.push({
          timestamp: timestamp,
          value: value
        });
      }
    }
  }

  return dataPoints;
}

export function useSiteEnergyData(
  timeRange: string = '-24h',
  updateInterval: number = 10000
) {
  const [data, setData] = useState<SiteEnergyData>({
    totalGas: null,
    totalElectricity: null,
    buildingBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate appropriate interval based on time range
  const getInterval = (range: string): string => {
    if (range === '-1h') return '1m';
    if (range === '-6h') return '5m';
    if (range === '-24h') return '15m';
    if (range === '-7d') return '1h';
    if (range === '-30d') return '6h';
    return '1d';
  };

  useEffect(() => {
    async function fetchSiteData() {
      try {
        setLoading(true);
        const interval = getInterval(timeRange);

        // Fetch electricity from site meter
        let electricityValue: number | null = null;
        const electricityDevice = getSiteElectricityDevice();
        if (electricityDevice) {
          const elecQuery = buildHistoricalRateFluxQuery(
            influxConfig.bucket,
            'alldata',
            'water',
            timeRange,
            interval,
            electricityDevice.deviceId
          );
          const elecCsv = await queryInfluxDB(elecQuery);
          const elecData = parseHistoricalCSV(elecCsv);
          
          // Sum all values to get total consumption over the period
          if (elecData.length > 0) {
            const totalPulses = elecData.reduce((sum, point) => sum + point.value, 0);
            electricityValue = totalPulses * electricityDevice.conversionFactor;
          }
        }

        // Fetch gas from all buildings
        const gasDevices = getAllGasDevices();
        const buildingBreakdown: SiteEnergyData['buildingBreakdown'] = [];
        let totalGasValue = 0;

        for (const device of gasDevices) {
          const gasQuery = buildHistoricalRateFluxQuery(
            influxConfig.bucket,
            'alldata',
            'water',
            timeRange,
            interval,
            device.deviceId
          );
          const gasCsv = await queryInfluxDB(gasQuery);
          const gasData = parseHistoricalCSV(gasCsv);
          
          let gasUsage: number | null = null;
          if (gasData.length > 0) {
            // Sum all values to get total consumption over the period
            const totalPulses = gasData.reduce((sum, point) => sum + point.value, 0);
            gasUsage = totalPulses * device.conversionFactor;
            totalGasValue += gasUsage;
          }

          buildingBreakdown.push({
            buildingId: device.buildingId,
            buildingName: device.buildingName,
            gasUsage: gasUsage
          });
        }

        setData({
          totalGas: totalGasValue > 0 ? totalGasValue : null,
          totalElectricity: electricityValue,
          buildingBreakdown: buildingBreakdown.sort((a, b) => 
            (b.gasUsage || 0) - (a.gasUsage || 0)
          )
        });

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching site energy data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSiteData();
    const interval = setInterval(fetchSiteData, updateInterval);
    
    return () => clearInterval(interval);
  }, [timeRange, updateInterval]);

  return { data, loading, error };
}