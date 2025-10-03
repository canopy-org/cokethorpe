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
    BuildingTag?: string
  ): string {
    const BuildingFilter = BuildingTag 
      ? `|> filter(fn: (r) => r.BuildingTag == "${BuildingTag}")` 
      : '';
    
    return `
      from(bucket: "${bucket}")
        |> range(start: ${timeRange})
        |> filter(fn: (r) => r._measurement == "${measurement}")
        |> filter(fn: (r) => r._field == "${field}")
        ${BuildingFilter}
        |> last()
    `;
  }
  
  export function buildHistoricalFluxQuery(
    bucket: string,
    measurement: string,
    field: string,
    timeRange: string,
    interval: string,
    BuildingTag?: string
  ): string {
    const BuildingFilter = BuildingTag 
      ? `|> filter(fn: (r) => r.BuildingTag == "${BuildingTag}")` 
      : '';
    
    return `
      from(bucket: "${bucket}")
        |> range(start: ${timeRange})
        |> filter(fn: (r) => r._measurement == "${measurement}")
        |> filter(fn: (r) => r._field == "${field}")
        ${BuildingFilter}
        |> aggregateWindow(every: ${interval}, fn: mean, createEmpty: false)
        |> yield(name: "mean")
    `;
  }
  