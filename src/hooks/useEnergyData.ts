import { useState, useEffect } from 'react';
import { queryInfluxDB, parseInfluxCSV, buildFluxQuery, buildRateFluxQuery, influxConfig } from '@/lib/influxdb';
import { getDeviceConversionFactor, getDeviceById, gas_kWh_L, oil_kWh_L } from '@/lib/buildings';

export type EnergyCalculationType = 'cumulative' | 'power' | 'normalized';

export function useEnergyData(
  buildingId: string,
  deviceId?: string,
  updateInterval: number = 5000,
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
        let query: string;
        
        if (calculationType === 'power') {
          // For rate calculation, get difference between consecutive readings
          query = buildRateFluxQuery(
            influxConfig.bucket,
            'alldata',
            'water',
            '-2h',
            '1h', // 1 hour window for power calculation
            deviceId
          );
        } else {
          // For cumulative and normalized, get the latest value
          query = buildFluxQuery(
            influxConfig.bucket,
            'alldata',
            'water',
            '-2h',
            deviceId
          );
        }

        const csvData = await queryInfluxDB(query);
        const pulseValue = parseInfluxCSV(csvData);
        
        if (pulseValue !== null) {
          // Convert pulses to energy using device-specific conversion factor
          let conversionFactor = getDeviceConversionFactor(buildingId, deviceId);
          const deviceObj = getDeviceById(buildingId, deviceId) ??
            getBuildingById(buildingId)?.devices.find(d => d.deviceId === deviceId);

          if (!conversionFactor) {
            conversionFactor = deviceObj?.conversionFactor ??
              (deviceObj?.energyType === 'oil' ? oil_kWh_L :
               deviceObj?.energyType === 'gas' ? gas_kWh_L : 1);
          }
          const energyValue = pulseValue * conversionFactor;
            
          // If normalized, divide by building area
          if (calculationType === 'normalized') {
            const building = getBuildingById(buildingId);
            if (building && building.area > 0) {
              energyValue = energyValue / building.area;
            }
          }
            
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
  }, [buildingId, deviceId, updateInterval, calculationType]);

  return { value, lastUpdate, error };
}