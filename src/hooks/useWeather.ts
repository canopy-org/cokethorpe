import { useState, useEffect } from 'react';
import { WeatherData } from '@/types/weather';
import { fetchWeather } from '@/lib/weather';

export function useWeather(updateInterval: number = 600000) { // 10 minutes default
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getWeather() {
      try {
        setLoading(true);
        const data = await fetchWeather();
        setWeather(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch weather');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    getWeather();
    const interval = setInterval(getWeather, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return { weather, loading, error };
}