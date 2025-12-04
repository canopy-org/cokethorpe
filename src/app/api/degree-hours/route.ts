import { NextRequest, NextResponse } from 'next/server';
import { queryInfluxDB, buildHistoricalFluxQuery, buildHistoricalRateFluxQuery, influxConfig } from '@/lib/influxdb';
import { getBuildingById, siteConfig } from '@/lib/buildings';

interface HourlyDataPoint {
  timestamp: string;
  value: number;
}

interface DailyDataPoint {
  date: string;
  degreeHours: number;
  energyUsage: number;
}

function parseHistoricalCSV(csv: string): HourlyDataPoint[] {
  const lines = csv.trim().split('\n');
  const dataPoints: HourlyDataPoint[] = [];

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

function aggregateToDaily(
  hourlyData: HourlyDataPoint[],
  aggregationType: 'sum' | 'mean'
): Map<string, number[]> {
  const dailyMap = new Map<string, number[]>();

  for (const point of hourlyData) {
    const date = point.timestamp.split('T')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, []);
    }
    dailyMap.get(date)!.push(point.value);
  }

  return dailyMap;
}

function calculateDegreeHours(
  hourlyTemps: number[],
  baseTemp: number
): number {
  return hourlyTemps.reduce((sum, temp) => {
    return sum + Math.max(0, baseTemp - temp);
  }, 0);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const buildingId = searchParams.get('buildingId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const baseTemp = parseFloat(searchParams.get('baseTemp') || '15.5');

  if (!buildingId || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: buildingId, startDate, endDate' },
      { status: 400 }
    );
  }

  const building = getBuildingById(buildingId);
  if (!building) {
    return NextResponse.json(
      { error: 'Building not found' },
      { status: 404 }
    );
  }

  // Get the energy device for this building
  const energyDeviceId = building.primarySensors.energy;
  if (!energyDeviceId) {
    return NextResponse.json(
      { error: 'No energy device configured for this building' },
      { status: 400 }
    );
  }

  // Find the device to get conversion factor
  const energyDevice = building.devices.find(d => d.deviceId === energyDeviceId);
  const conversionFactor = energyDevice?.conversionFactor || 1;

  // Get OAT sensor device ID from site config
  const oatDeviceId = siteConfig.oatSensorDeviceId;
  if (!oatDeviceId) {
    return NextResponse.json(
      { error: 'No OAT sensor configured in site config' },
      { status: 400 }
    );
  }

  try {
    // Format dates for InfluxDB query
    const startTime = `${startDate}T00:00:00Z`;
    const stopTime = `${endDate}T23:59:59Z`;

    // Fetch hourly OAT data
    const oatQuery = buildHistoricalFluxQuery(
      influxConfig.bucket,
      'alldata',
      'temperature',
      startTime,
      '1h',
      oatDeviceId,
      stopTime
    );

    // Fetch hourly energy data (rate/consumption per hour)
    const energyQuery = buildHistoricalRateFluxQuery(
      influxConfig.bucket,
      'alldata',
      'water',
      startTime,
      '1h',
      energyDeviceId,
      stopTime
    );

    // Execute both queries
    const [oatCsv, energyCsv] = await Promise.all([
      queryInfluxDB(oatQuery),
      queryInfluxDB(energyQuery)
    ]);

    // Parse CSV responses
    const oatHourly = parseHistoricalCSV(oatCsv);
    const energyHourly = parseHistoricalCSV(energyCsv);

    // Aggregate to daily
    const oatDaily = aggregateToDaily(oatHourly, 'mean');
    const energyDaily = aggregateToDaily(energyHourly, 'sum');

    // Build paired data points
    const dailyData: DailyDataPoint[] = [];
    
    // Get all dates that have both OAT and energy data
    const allDates = new Set([...oatDaily.keys(), ...energyDaily.keys()]);
    
    for (const date of Array.from(allDates).sort()) {
      const oatValues = oatDaily.get(date);
      const energyValues = energyDaily.get(date);

      // Only include days with sufficient data (at least 12 hours of readings)
      if (oatValues && oatValues.length >= 12 && energyValues && energyValues.length > 0) {
        const degreeHours = calculateDegreeHours(oatValues, baseTemp);
        const energyUsage = energyValues.reduce((sum, v) => sum + v, 0) * conversionFactor;

        // Only include if there's meaningful heating demand
        if (degreeHours > 0) {
          dailyData.push({
            date,
            degreeHours: Math.round(degreeHours * 100) / 100,
            energyUsage: Math.round(energyUsage * 100) / 100
          });
        }
      }
    }

    // Calculate regression line (simple linear regression)
    let regression = null;
    if (dailyData.length >= 3) {
      const n = dailyData.length;
      const sumX = dailyData.reduce((s, d) => s + d.degreeHours, 0);
      const sumY = dailyData.reduce((s, d) => s + d.energyUsage, 0);
      const sumXY = dailyData.reduce((s, d) => s + d.degreeHours * d.energyUsage, 0);
      const sumX2 = dailyData.reduce((s, d) => s + d.degreeHours * d.degreeHours, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Calculate R² (coefficient of determination)
      const meanY = sumY / n;
      const ssTotal = dailyData.reduce((s, d) => s + Math.pow(d.energyUsage - meanY, 2), 0);
      const ssResidual = dailyData.reduce((s, d) => {
        const predicted = slope * d.degreeHours + intercept;
        return s + Math.pow(d.energyUsage - predicted, 2);
      }, 0);
      const rSquared = 1 - (ssResidual / ssTotal);

      regression = {
        slope: Math.round(slope * 1000) / 1000,
        intercept: Math.round(intercept * 100) / 100,
        rSquared: Math.round(rSquared * 1000) / 1000
      };
    }

    return NextResponse.json({
      data: dailyData,
      buildingName: building.name,
      buildingArea: building.area,
      baseTemp,
      regression,
      metadata: {
        oatDataPoints: oatHourly.length,
        energyDataPoints: energyHourly.length,
        daysWithData: dailyData.length
      }
    });

  } catch (error) {
    console.error('Degree hours API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch degree hours data' },
      { status: 500 }
    );
  }
}