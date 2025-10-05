'use client';

import { useWeather } from '@/hooks/useWeather';
import { getWeatherIcon } from '@/lib/weather';

export default function WeatherWidget() {
  const { weather, loading, error } = useWeather();

  if (loading) {
    return (
      <div className="text-sm">
        <span className="text-gray-400">Loading weather...</span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="text-sm">
        <span className="text-gray-400">Weather unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <img 
        src={getWeatherIcon(weather.icon)} 
        alt={weather.description}
        className="w-10 h-10"
      />
      <div className="text-sm">
        <div className="font-semibold">{weather.temp}°C</div>
        <div className="text-xs text-gray-300 capitalize">{weather.description}</div>
      </div>
    </div>
  );
}