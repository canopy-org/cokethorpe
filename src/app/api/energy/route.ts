import { NextRequest, NextResponse } from 'next/server';
import { queryInfluxDB, parseInfluxCSV, buildFluxQuery, buildRateFluxQuery, influxConfig } from '@/lib/influxdb';
import { getDeviceConversionFactor, getBuildingById } from '@/lib/buildings';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const buildingId = searchParams.get('buildingId');
  const deviceId = searchParams.get('deviceId');
  const calculationType = searchParams.get('calculationType') || 'cumulative';

  if (!buildingId || !deviceId) {
    return NextResponse.json({ error: 'Missing buildingId or deviceId' }, { status: 400 });
  }

  try {
    let query: string;

    if (calculationType === 'power') {
      query = buildRateFluxQuery(
        influxConfig.bucket,
        'alldata',
        'water',
        '-2h',
        '1h',
        deviceId
      );
    } else if (calculationType === 'normalized') {
      query = buildRateFluxQuery(
        influxConfig.bucket,
        'alldata',
        'water',
        '-365d',
        '365d',
        deviceId
      );
    } else {
      query = buildFluxQuery(
        influxConfig.bucket,
        'alldata',
        'water',
        '-2h',
        deviceId
      );
    }

    const csvData = await queryInfluxDB(query);
    const pulseValue = parseInfluxCSV(csvData);

    if (pulseValue === null) {
      return NextResponse.json({ value: null });
    }

    const conversionFactor = getDeviceConversionFactor(buildingId, deviceId) || 1;
    let energyValue = pulseValue * conversionFactor;

    if (calculationType === 'normalized') {
      const building = getBuildingById(buildingId);
      if (building && building.area > 0) {
        energyValue = energyValue / building.area;
      }
    }

    return NextResponse.json({ value: energyValue });
  } catch (error) {
    console.error('Energy API error:', error);
    return NextResponse.json({ error: 'Failed to fetch energy data' }, { status: 500 });
  }
}