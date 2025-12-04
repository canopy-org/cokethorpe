import { useState, useEffect } from 'react';

export interface DegreeHoursDataPoint {
  date: string;
  degreeHours: number;
  energyUsage: number;
}

export interface RegressionResult {
  slope: number;      // kWh per degree-hour (heat loss coefficient proxy)
  intercept: number;  // Base load in kWh
  rSquared: number;   // Goodness of fit (0-1)
}

export interface DegreeHoursData {
  data: DegreeHoursDataPoint[];
  buildingName: string;
  buildingArea: number;
  baseTemp: number;
  regression: RegressionResult | null;
  metadata: {
    oatDataPoints: number;
    energyDataPoints: number;
    daysWithData: number;
  };
}

interface UseDegreeHoursDataOptions {
  buildingId: string;
  startDate: string;  // YYYY-MM-DD format
  endDate: string;    // YYYY-MM-DD format
  baseTemp?: number;  // Default 15.5°C
}

export function useDegreeHoursData({
  buildingId,
  startDate,
  endDate,
  baseTemp = 15.5
}: UseDegreeHoursDataOptions) {
  const [data, setData] = useState<DegreeHoursData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!buildingId || !startDate || !endDate) {
      setData(null);
      setLoading(false);
      return;
    }

    async function fetchDegreeHoursData() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          buildingId,
          startDate,
          endDate,
          baseTemp: baseTemp.toString()
        });

        const response = await fetch(`/api/degree-hours?${params}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch degree hours data');
        }

        setData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error fetching degree hours data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDegreeHoursData();
  }, [buildingId, startDate, endDate, baseTemp]);

  return { data, loading, error };
}