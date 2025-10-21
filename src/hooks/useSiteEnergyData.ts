import { useState, useEffect } from 'react';
import { queryInfluxDB, buildHistoricalRateFluxQuery, influxConfig } from '@/lib/influxdb';
import { getAllGasDevices, getAllOilDevices, getSiteElectricityDevice } from '@/lib/buildings';

export interface SiteEnergyData {
  totalGas: number | null;
  totalOil: number | null;
  totalElectricity: number | null;
  buildingBreakdown: {
    buildingId: string;
    buildingName: string;
    gasUsage?: number | null;
    oilUsage?: number | null;
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
    totalOil: null,
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

        // Fetch gas and oil from all buildings
        const gasDevices = getAllGasDevices();
        const oilDevices = getAllOilDevices();
        // Aggregate gas + oil into single breakdown map
        const breakdownMap = new Map<string, {
          buildingId: string;
          buildingName: string;
          gasUsage: number | null;
          oilUsage: number | null;
        }>();

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
            const totalPulses = gasData.reduce((sum, point) => sum + point.value, 0);
            gasUsage = totalPulses * device.conversionFactor;
            totalGasValue += gasUsage;
          }

          const entry = breakdownMap.get(device.buildingId) ?? {
            buildingId: device.buildingId,
            buildingName: device.buildingName,
            gasUsage: null,
            oilUsage: null
          };
          entry.gasUsage = (entry.gasUsage || 0) + (gasUsage || 0) || null;
          breakdownMap.set(device.buildingId, entry);
        }

        let totalOilValue = 0;
        for (const device of oilDevices) {
          const oilQuery = buildHistoricalRateFluxQuery(
            influxConfig.bucket,
            'alldata',
            'water',
            timeRange,
            interval,
            device.deviceId
          );
          const oilCsv = await queryInfluxDB(oilQuery);
          const oilData = parseHistoricalCSV(oilCsv);
          
          let oilUsage: number | null = null;
          if (oilData.length > 0) {
            const totalPulses = oilData.reduce((sum, point) => sum + point.value, 0);
            oilUsage = totalPulses * device.conversionFactor;
            totalOilValue += oilUsage;
          }

          const entry = breakdownMap.get(device.buildingId) ?? {
            buildingId: device.buildingId,
            buildingName: device.buildingName,
            gasUsage: null,
            oilUsage: null
          };
          entry.oilUsage = (entry.oilUsage || 0) + (oilUsage || 0) || null;
          breakdownMap.set(device.buildingId, entry);
        }

        const buildingBreakdown = Array.from(breakdownMap.values());

        setData({
          totalOil: totalOilValue > 0 ? totalOilValue : null,
          totalGas: totalGasValue > 0 ? totalGasValue : null,
          totalElectricity: electricityValue,
          // sort by combined gas + oil (descending)
          buildingBreakdown: buildingBreakdown.sort((a, b) =>
            ((b.gasUsage || 0) + (b.oilUsage || 0)) - ((a.gasUsage || 0) + (a.oilUsage || 0))
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