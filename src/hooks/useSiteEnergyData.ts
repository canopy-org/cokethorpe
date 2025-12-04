import { useState, useEffect } from 'react';

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
  timeSeries?: {
    gas: { timestamp: string; value: number }[];
    oil: { timestamp: string; value: number }[];
  };
}

export function useSiteEnergyData(
  timeRange: string = '-24h',
  interval: string = '15m',
  updateInterval: number = 10000,
  stopTime?: string
) {
  const [data, setData] = useState<SiteEnergyData>({
    totalGas: null,
    totalOil: null,
    totalElectricity: null,
    buildingBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSiteData() {
      try {
        setLoading(true);

        const params = new URLSearchParams({ timeRange, interval });
        if (stopTime) params.set('stopTime', stopTime);

        const response = await fetch(`/api/site-energy?${params}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch');
        }

        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching site energy data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSiteData();
    const intervalId = setInterval(fetchSiteData, updateInterval);

    return () => clearInterval(intervalId);
  }, [timeRange, interval, updateInterval, stopTime]);

  return { data, loading, error };
}