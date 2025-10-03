export type WeatherData = {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  location: string;
};

const WEATHER_LOCATION_LAT = process.env.NEXT_PUBLIC_WEATHER_LAT || '51.7855'; // Witney latitude
const WEATHER_LOCATION_LON = process.env.NEXT_PUBLIC_WEATHER_LON || '-1.4905'; // Witney longitude
const WEATHER_LOCATION_NAME = process.env.NEXT_PUBLIC_WEATHER_LOCATION_NAME || 'Witney';

export async function fetchWeather(): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LOCATION_LAT}&longitude=${WEATHER_LOCATION_LON}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Europe%2FLondon`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;

    return {
      temp: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.temperature_2m), // Open-Meteo doesn't provide feels_like in free tier
      description: getWeatherDescription(current.weather_code),
      icon: getWeatherIconCode(current.weather_code),
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      location: WEATHER_LOCATION_NAME
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

// WMO Weather interpretation codes
function getWeatherDescription(code: number): string {
  const descriptions: { [key: number]: string } = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return descriptions[code] || 'Unknown';
}

function getWeatherIconCode(code: number): string {
  // Map WMO codes to icon codes
  if (code === 0) return '01d'; // clear sky
  if (code <= 3) return '02d'; // partly cloudy
  if (code <= 48) return '50d'; // fog
  if (code <= 55) return '09d'; // drizzle
  if (code <= 65) return '10d'; // rain
  if (code <= 77) return '13d'; // snow
  if (code <= 82) return '09d'; // showers
  if (code <= 86) return '13d'; // snow showers
  if (code >= 95) return '11d'; // thunderstorm
  return '01d';
}

export function getWeatherIcon(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

export function getWeatherEmoji(iconCode: string): string {
  const iconMap: { [key: string]: string } = {
    '01d': '☀️',
    '01n': '🌙',
    '02d': '⛅',
    '02n': '☁️',
    '03d': '☁️',
    '03n': '☁️',
    '04d': '☁️',
    '04n': '☁️',
    '09d': '🌧️',
    '09n': '🌧️',
    '10d': '🌦️',
    '10n': '🌧️',
    '11d': '⛈️',
    '11n': '⛈️',
    '13d': '❄️',
    '13n': '❄️',
    '50d': '🌫️',
    '50n': '🌫️',
  };
  return iconMap[iconCode] || '🌡️';
}