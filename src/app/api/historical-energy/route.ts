import { NextRequest, NextResponse } from 'next/server';
import { queryInfluxDB, buildHistoricalFluxQuery, buildHistoricalRateFluxQuery, influxConfig } from '@/lib/influxdb';
import { getDeviceConversionFactor, getBuildingById, gas_kWh_L, oil_kWh_L, getDeviceById } from '@/lib/buildings';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const buildingId = searchParams.get('buildingId');
  const timeRange = searchParams.get('timeRange') || '-24h';
  const interval = searchParams.get('interval') || '15m';
  const deviceId = searchParams.get('deviceId') || undefined;
  const calculationType = searchParams.get('calculationType') || 'cumulative';
  const stopTime = searchParams.get('stopTime') || undefined;

  if (!buildingId) {
    return NextResponse.json({ error: 'Missing buildingId' }, { status: 400 });
  }

  if (!deviceId) {
    return NextResponse.json({ data: [] });
  }

  try {
    let query: string;

    if (calculationType === 'rate') {
      query = buildHistoricalRateFluxQuery(
        influxConfig.bucket,
        'alldata',
        'water',
        timeRange,
        interval,
        deviceId,
        stopTime
      );
    } else {
      query = buildHistoricalFluxQuery(
        influxConfig.bucket,
        'alldata',
        'water',
        timeRange,
        interval,
        deviceId,
        stopTime
      );
    }

    const csvData = await queryInfluxDB(query);
    const parsed = parseHistoricalCSV(csvData);

    // Determine conversion factor
    let conversionFactor = getDeviceConversionFactor(buildingId, deviceId);
    const deviceObj = getDeviceById(buildingId, deviceId) ?? getBuildingById(buildingId)?.devices?.find(d => d.deviceId === deviceId);
    
    if (!conversionFactor || conversionFactor === 0) {
      conversionFactor = deviceObj?.conversionFactor ?? 
        (deviceObj?.energyType === 'oil' ? oil_kWh_L : 
         deviceObj?.energyType === 'gas' ? gas_kWh_L : 1);
    }

    let data = parsed.map(point => ({
      timestamp: point.timestamp,
      value: point.value * conversionFactor
    }));

    // If normalized, divide by building area
    if (calculationType === 'normalized') {
      const building = getBuildingById(buildingId);
      if (building && building.area > 0) {
        data = data.map(point => ({
          timestamp: point.timestamp,
          value: point.value / building.area
        }));
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Historical energy API error:', error);
    return NextResponse.json({ error: 'Failed to fetch historical energy data' }, { status: 500 });
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