import { NextRequest, NextResponse } from 'next/server';
import { queryInfluxDB, buildHistoricalFluxQuery, influxConfig } from '@/lib/influxdb';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const metric = searchParams.get('metric');
  const timeRange = searchParams.get('timeRange') || '-24h';
  const interval = searchParams.get('interval') || '15m';
  const deviceId = searchParams.get('deviceId') || undefined;
  const stopTime = searchParams.get('stopTime') || undefined;

  if (!metric) {
    return NextResponse.json({ error: 'Missing metric parameter' }, { status: 400 });
  }

  if (!deviceId) {
    return NextResponse.json({ data: [] });
  }

  try {
    const field = metric === 'temperature' ? 'temperature' : 'humidity';

    const query = buildHistoricalFluxQuery(
      influxConfig.bucket,
      'alldata',
      field,
      timeRange,
      interval,
      deviceId,
      stopTime
    );

    const csvData = await queryInfluxDB(query);
    const data = parseHistoricalCSV(csvData);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Historical API error:', error);
    return NextResponse.json({ error: 'Failed to fetch historical data' }, { status: 500 });
  }
}

function parseHistoricalCSV(csv: string): Array<{ timestamp: string; value: number }> {
  const lines = csv.trim().split('\n');
  const dataPoints: Array<{ timestamp: string; value: number }> = [];

  const dataLines = lines.filter(line =>
    !line.startsWith('#') &&
    !line.startsWith(',result,') &&
    line.trim() !== ''
  );

  for (const line of dataLines) {
    const values = line.split(',');
    if (values.length > 6) {
      const timestamp = values[5];
      const value = parseFloat(values[6]);
      if (!isNaN(value) && timestamp) {
        dataPoints.push({ timestamp, value });
      }
    }
  }

  return dataPoints;
}