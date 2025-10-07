export interface InfluxConfig {
  url: string;
  token: string;
  org: string;
  bucket: string;
}

export const influxConfig: InfluxConfig = {
  url: process.env.NEXT_PUBLIC_INFLUX_URL || 'https://influx.gedata.uk',
  token: process.env.NEXT_PUBLIC_INFLUX_TOKEN || 'XZFvjXEqKubXQGXlYg3YOYlTjL_puyp295Ki_jrDmW8o40OaJHok09PmsFHZLpOCrwT6G_sLL3jANOiaM-pXWg==',
  org: process.env.NEXT_PUBLIC_INFLUX_ORG || 'GEData',
  bucket: process.env.NEXT_PUBLIC_INFLUX_BUCKET || 'lora_peckham_pulse',
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

export function buildHistoricalFluxQuery(
  bucket: string,
  measurement: string,
  field: string,
  timeRange: string,
  interval: string,
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
      |> aggregateWindow(every: ${interval}, fn: mean, createEmpty: false)
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
 */
export function buildHistoricalRateFluxQuery(
  bucket: string,
  measurement: string,
  field: string,
  timeRange: string,
  interval: string,
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
      |> aggregateWindow(every: ${interval}, fn: last, createEmpty: false)
      |> difference(nonNegative: true)
      |> yield(name: "rate")
  `;
}