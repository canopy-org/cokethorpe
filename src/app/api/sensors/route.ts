import { NextRequest, NextResponse } from 'next/server';
import { queryInfluxDB, parseInfluxCSV, buildFluxQuery, influxConfig } from '@/lib/influxdb';

export async function GET(request: NextRequest) {

  
  const searchParams = request.nextUrl.searchParams;
  const metric = searchParams.get('metric');
  const deviceId = searchParams.get('deviceId') || undefined;

  if (!metric) {
    return NextResponse.json({ error: 'Missing metric parameter' }, { status: 400 });
  }

  try {
    const query = buildFluxQuery(
      influxConfig.bucket,
      'alldata',
      metric,
      '-2h',
      deviceId
    );

    const csvData = await queryInfluxDB(query);
    const value = parseInfluxCSV(csvData);

    return NextResponse.json({ value });
  } catch (error) {
    console.error('Sensor API error:', error);
    return NextResponse.json({ error: 'Failed to fetch sensor data' }, { status: 500 });
  }
}