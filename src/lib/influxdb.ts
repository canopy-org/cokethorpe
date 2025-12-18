export interface InfluxConfig {
  url: string;
  token: string;
  org: string;
  bucket: string;
}

// Server-side only - these env vars won't be available in client components
export const influxConfig: InfluxConfig = {
  url: process.env.INFLUX_URL || '',
  token: process.env.INFLUX_TOKEN || '',
  org: process.env.INFLUX_ORG || '',
  bucket: process.env.INFLUX_BUCKET || '',
};

export async function queryInfluxDB(query: string): Promise<string> {
  const response = await fetch(`${influxConfig.url}/api/v2/query?org=${influxConfig.org}`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${influxConfig.token}`,
      'Content-Type': 'application/vnd.flux',
      'Accept': 'application/csv'
    },
    body: query
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('InfluxDB error response:', errorText);
    throw new Error(`InfluxDB error: ${response.status}`);
  }

  return await response.text();
}

export function parseInfluxCSV(csv: string): number | null {
  const lines = csv.trim().split('\n');
  
  const dataLines = lines.filter(line => 
    !line.startsWith('#') && 
    !line.startsWith(',result,') &&
    line.trim() !== ''
  );

  if (dataLines.length > 0) {
    const values = dataLines[0].split(',');
    return parseFloat(values[6]);
  }

  return null;
}

export function buildFluxQuery(
  bucket: string,
  measurement: string,
  field: string,
  timeRange: string = '-2h',
  deviceId?: string
): string {
  
  const deviceFilter = deviceId
    ? `|> filter(fn: (r) => r.Device == "${deviceId}")`
    : '';
  
  return `
    from(bucket: "${bucket}")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => r._field == "${field}")
      ${deviceFilter}
      |> last()
  `;
}

/**
 * Build a historical Flux query with support for both relative and absolute time ranges
 * @param timeRange - Either relative (e.g., "-24h") or absolute ISO timestamps (e.g., "2024-11-06T00:00:00Z")
 * @param stopTime - Optional stop time for absolute ranges (ISO timestamp)
 */
export function buildHistoricalFluxQuery(
  bucket: string,
  measurement: string,
  field: string,
  timeRange: string,
  interval: string,
  deviceId?: string,
  stopTime?: string
): string {

  const deviceFilter = deviceId
    ? `|> filter(fn: (r) => r.Device == "${deviceId}")`
    : '';
  
  // Build the range clause - handle both relative and absolute times
  // For absolute times, ensure they're in RFC3339 format (remove milliseconds if present)
  let rangeClause: string;
  if (stopTime) {
    const startFormatted = timeRange.replace(/\.\d{3}Z$/, 'Z'); // Remove milliseconds
    const stopFormatted = stopTime.replace(/\.\d{3}Z$/, 'Z'); // Remove milliseconds
    rangeClause = `range(start: ${startFormatted}, stop: ${stopFormatted})`;
  } else {
    rangeClause = `range(start: ${timeRange})`;
  }
  
  return `
    from(bucket: "${bucket}")
      |> ${rangeClause}
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => r._field == "${field}")
      ${deviceFilter}
      |> aggregateWindow(every: ${interval}, fn: mean, createEmpty: false, timeSrc: "_start")
      |> yield(name: "mean")
  `;
}

/**
 * Build a Flux query that calculates the rate of change (difference between readings)
 * This is useful for calculating energy consumption per time period from cumulative pulse counts
 */
export function buildRateFluxQuery(
  bucket: string,
  measurement: string,
  field: string,
  timeRange: string = '-2h',
  windowInterval: string = '5m',
  deviceId?: string
): string {
  
  const deviceFilter = deviceId
    ? `|> filter(fn: (r) => r.Device == "${deviceId}")`
    : '';
  
  return `
    from(bucket: "${bucket}")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => r._field == "${field}")
      ${deviceFilter}
      |> aggregateWindow(every: ${windowInterval}, fn: last, createEmpty: false)
      |> difference(nonNegative: true)
      |> last()
  `;
}

/**
 * Build a historical Flux query with rate of change calculation
 * Returns the difference between consecutive readings over time
 * @param timeRange - Either relative (e.g., "-24h") or absolute ISO timestamps (e.g., "2024-11-06T00:00:00Z")
 * @param stopTime - Optional stop time for absolute ranges (ISO timestamp)
 */
export function buildHistoricalRateFluxQuery(
  bucket: string,
  measurement: string,
  field: string,
  timeRange: string,
  interval: string,
  deviceId?: string,
  stopTime?: string
): string {

  const deviceFilter = deviceId
    ? `|> filter(fn: (r) => r.Device == "${deviceId}")`
    : '';
  
  // Build the range clause - handle both relative and absolute times
  // For absolute times, ensure they're in RFC3339 format (remove milliseconds if present)
  let rangeClause: string;
  if (stopTime) {
    const startFormatted = timeRange.replace(/\.\d{3}Z$/, 'Z'); // Remove milliseconds
    const stopFormatted = stopTime.replace(/\.\d{3}Z$/, 'Z'); // Remove milliseconds
    rangeClause = `range(start: ${startFormatted}, stop: ${stopFormatted})`;
  } else {
    rangeClause = `range(start: ${timeRange})`;
  }
  
  return `
    from(bucket: "${bucket}")
      |> ${rangeClause}
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => r._field == "${field}")
      ${deviceFilter}
      |> aggregateWindow(every: ${interval}, fn: last, createEmpty: false, timeSrc: "_start")
      |> difference(nonNegative: true)
      |> yield(name: "rate")
  `;
}