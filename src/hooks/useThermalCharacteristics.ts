import { useState, useEffect } from 'react';

export interface ThermalCharacteristics {
  hlc: number | null;              // Heat Loss Coefficient in kW/K
  hlcPerArea: number | null;       // HLC normalised: W/m²K
  tau: number | null;              // Thermal time constant in hours
  thermalMass: number | null;      // Effective thermal mass in kWh/K
  thermalMassPerArea: number | null; // Thermal mass normalised: Wh/m²K
  heatedHours: number;             // Number of valid heated hours used
  coolingPeriods: number;          // Number of cooling periods found
  avgDeltaT: number | null;        // Average indoor-outdoor temp difference
}

export interface ThermalCharacteristicsData {
  characteristics: ThermalCharacteristics;
  buildingName: string;
  buildingArea: number;
  dataPoints: number;
  energyType: string;
  message?: string;
}

interface UseThermalCharacteristicsOptions {
  buildingId: string;
  startDate: string;
  endDate: string;
}

export function useThermalCharacteristics({
  buildingId,
  startDate,
  endDate
}: UseThermalCharacteristicsOptions) {
  const [data, setData] = useState<ThermalCharacteristicsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!buildingId || !startDate || !endDate) {
      setData(null);
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ buildingId, startDate, endDate });
        const response = await fetch(`/api/thermal-characteristics?${params}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch thermal characteristics');
        }

        setData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error fetching thermal characteristics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [buildingId, startDate, endDate]);

  return { data, loading, error };
}