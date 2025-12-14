import { NextRequest, NextResponse } from 'next/server';
import { queryInfluxDB, buildHistoricalFluxQuery, buildHistoricalRateFluxQuery, influxConfig } from '@/lib/influxdb';
import { getBuildingById, siteConfig } from '@/lib/buildings';

interface HourlyDataPoint {
  timestamp: string;
  value: number;
}

interface ThermalCharacteristics {
  // Heat Loss Coefficient (from heated periods)
  hlc: number | null;           // kW/K
  hlcPerArea: number | null;    // W/m²K
  
  // Thermal Time Constant (from cooling periods)
  tau: number | null;           // hours
  
  // Derived: Effective Thermal Mass
  thermalMass: number | null;   // kWh/K
  thermalMassPerArea: number | null; // Wh/m²K
  
  // Data quality metrics
  heatedHours: number;
  coolingPeriods: number;
  avgDeltaT: number | null;
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

// Align time series by timestamp (hourly)
function alignTimeSeries(
  indoor: HourlyDataPoint[],
  outdoor: HourlyDataPoint[],
  energy: HourlyDataPoint[]
): { timestamp: string; indoor: number; outdoor: number; energy: number }[] {
  const indoorMap = new Map(indoor.map(p => [p.timestamp.slice(0, 13), p.value]));
  const outdoorMap = new Map(outdoor.map(p => [p.timestamp.slice(0, 13), p.value]));
  const energyMap = new Map(energy.map(p => [p.timestamp.slice(0, 13), p.value]));

  const allHours = new Set([
    ...indoorMap.keys(),
    ...outdoorMap.keys(),
    ...energyMap.keys()
  ]);

  const aligned: { timestamp: string; indoor: number; outdoor: number; energy: number }[] = [];

  for (const hour of Array.from(allHours).sort()) {
    const indoorVal = indoorMap.get(hour);
    const outdoorVal = outdoorMap.get(hour);
    const energyVal = energyMap.get(hour);

    if (indoorVal !== undefined && outdoorVal !== undefined && energyVal !== undefined) {
      aligned.push({
        timestamp: hour,
        indoor: indoorVal,
        outdoor: outdoorVal,
        energy: energyVal
      });
    }
  }

  return aligned;
}

// Calculate HLC from heated periods (when energy > threshold and deltaT > threshold)
function calculateHLC(
  data: { indoor: number; outdoor: number; energy: number }[],
  conversionFactor: number
): { hlc: number | null; count: number; avgDeltaT: number | null } {
  const MIN_DELTA_T = 5; // Minimum temperature difference for meaningful calculation
  const MIN_ENERGY = 0.1; // Minimum energy (pulses) to consider as "heating"

  const validPoints = data.filter(p => {
    const deltaT = p.indoor - p.outdoor;
    return deltaT >= MIN_DELTA_T && p.energy >= MIN_ENERGY;
  });

  if (validPoints.length < 10) {
    return { hlc: null, count: validPoints.length, avgDeltaT: null };
  }

  // Calculate HLC for each point: HLC = Q / deltaT
  const hlcValues = validPoints.map(p => {
    const deltaT = p.indoor - p.outdoor;
    const energyKWh = p.energy * conversionFactor; // Convert pulses to kWh
    return energyKWh / deltaT; // kWh/K per hour = kW/K
  });

  // Use median to reduce outlier impact
  hlcValues.sort((a, b) => a - b);
  const median = hlcValues[Math.floor(hlcValues.length / 2)];

  // Filter to values within 2x of median for averaging
  const filtered = hlcValues.filter(v => v > median * 0.3 && v < median * 3);
  const avgHLC = filtered.length > 0 
    ? filtered.reduce((s, v) => s + v, 0) / filtered.length 
    : median;

  const avgDeltaT = validPoints.reduce((s, p) => s + (p.indoor - p.outdoor), 0) / validPoints.length;

  return { 
    hlc: avgHLC, 
    count: validPoints.length,
    avgDeltaT 
  };
}

// Find and analyse cooling periods (consecutive hours with minimal/no heating)
function findCoolingPeriods(
  data: { timestamp: string; indoor: number; outdoor: number; energy: number }[]
): { tau: number | null; periodCount: number } {
  const MIN_COOLING_HOURS = 6; // Minimum hours for valid cooling period
  const MAX_ENERGY_THRESHOLD = 0.05; // Maximum energy to consider "unheated"

  // Find consecutive periods of low/no heating
  const periods: { start: number; end: number }[] = [];
  let periodStart: number | null = null;

  for (let i = 0; i < data.length; i++) {
    const isUnheated = data[i].energy <= MAX_ENERGY_THRESHOLD;
    
    if (isUnheated && periodStart === null) {
      periodStart = i;
    } else if (!isUnheated && periodStart !== null) {
      if (i - periodStart >= MIN_COOLING_HOURS) {
        periods.push({ start: periodStart, end: i - 1 });
      }
      periodStart = null;
    }
  }

  // Handle period extending to end of data
  if (periodStart !== null && data.length - periodStart >= MIN_COOLING_HOURS) {
    periods.push({ start: periodStart, end: data.length - 1 });
  }

  if (periods.length === 0) {
    return { tau: null, periodCount: 0 };
  }

  // Calculate tau for each cooling period using exponential fit
  const tauValues: number[] = [];

  for (const period of periods) {
    const periodData = data.slice(period.start, period.end + 1);
    
    // Need sufficient temperature drop to fit
    const tempDrop = periodData[0].indoor - periodData[periodData.length - 1].indoor;
    if (tempDrop < 1) continue; // Skip if less than 1°C drop

    // Fit exponential decay: T(t) = T_out + (T_0 - T_out) * exp(-t/tau)
    // Linearised: ln((T - T_out) / (T_0 - T_out)) = -t/tau
    
    const T_out = periodData.reduce((s, p) => s + p.outdoor, 0) / periodData.length;
    const T_0 = periodData[0].indoor;
    
    if (T_0 <= T_out) continue; // Invalid starting condition

    const points: { t: number; y: number }[] = [];
    
    for (let i = 0; i < periodData.length; i++) {
      const T = periodData[i].indoor;
      const ratio = (T - T_out) / (T_0 - T_out);
      if (ratio > 0.1 && ratio < 1) { // Valid range for log
        points.push({ t: i, y: Math.log(ratio) });
      }
    }

    if (points.length < 4) continue;

    // Linear regression on linearised form: y = -t/tau => slope = -1/tau
    const n = points.length;
    const sumT = points.reduce((s, p) => s + p.t, 0);
    const sumY = points.reduce((s, p) => s + p.y, 0);
    const sumTY = points.reduce((s, p) => s + p.t * p.y, 0);
    const sumT2 = points.reduce((s, p) => s + p.t * p.t, 0);

    const slope = (n * sumTY - sumT * sumY) / (n * sumT2 - sumT * sumT);
    
    if (slope < 0) {
      const tau = -1 / slope;
      if (tau > 2 && tau < 200) { // Reasonable range: 2-200 hours
        tauValues.push(tau);
      }
    }
  }

  if (tauValues.length === 0) {
    return { tau: null, periodCount: periods.length };
  }

  // Return median tau
  tauValues.sort((a, b) => a - b);
  const medianTau = tauValues[Math.floor(tauValues.length / 2)];

  return { tau: medianTau, periodCount: periods.length };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const buildingId = searchParams.get('buildingId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!buildingId || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: buildingId, startDate, endDate' },
      { status: 400 }
    );
  }

  const building = getBuildingById(buildingId);
  if (!building) {
    return NextResponse.json({ error: 'Building not found' }, { status: 404 });
  }

  // Get device IDs
  const energyDeviceId = building.primarySensors.energy;
  const tempDeviceId = building.primarySensors.temperature;
  const oatDeviceId = siteConfig.oatSensorDeviceId;

  if (!energyDeviceId || !tempDeviceId || !oatDeviceId) {
    return NextResponse.json(
      { error: 'Building missing required sensors (energy, temperature, or OAT)' },
      { status: 400 }
    );
  }

  const energyDevice = building.devices.find(d => d.deviceId === energyDeviceId);
  const conversionFactor = energyDevice?.conversionFactor || 1;

  try {
    const startTime = `${startDate}T00:00:00Z`;
    const stopTime = `${endDate}T23:59:59Z`;

    // Fetch all three time series
    const [indoorCsv, oatCsv, energyCsv] = await Promise.all([
      queryInfluxDB(buildHistoricalFluxQuery(
        influxConfig.bucket, 'alldata', 'temperature', startTime, '1h', tempDeviceId, stopTime
      )),
      queryInfluxDB(buildHistoricalFluxQuery(
        influxConfig.bucket, 'alldata', 'temperature', startTime, '1h', oatDeviceId, stopTime
      )),
      queryInfluxDB(buildHistoricalRateFluxQuery(
        influxConfig.bucket, 'alldata', 'water', startTime, '1h', energyDeviceId, stopTime
      ))
    ]);

    const indoorData = parseHistoricalCSV(indoorCsv);
    const oatData = parseHistoricalCSV(oatCsv);
    const energyData = parseHistoricalCSV(energyCsv);

    // Align all time series
    const aligned = alignTimeSeries(indoorData, oatData, energyData);

    if (aligned.length < 24) {
      return NextResponse.json({
        characteristics: {
          hlc: null,
          hlcPerArea: null,
          tau: null,
          thermalMass: null,
          thermalMassPerArea: null,
          heatedHours: 0,
          coolingPeriods: 0,
          avgDeltaT: null
        },
        buildingName: building.name,
        buildingArea: building.area,
        dataPoints: aligned.length,
        message: 'Insufficient aligned data points'
      });
    }

    // Calculate HLC
    const { hlc, count: heatedHours, avgDeltaT } = calculateHLC(aligned, conversionFactor);

    // Find cooling periods and calculate tau
    const { tau, periodCount: coolingPeriods } = findCoolingPeriods(aligned);

    // Derive thermal mass: C = tau * HLC
    const thermalMass = (tau !== null && hlc !== null) ? tau * hlc : null;

    const characteristics: ThermalCharacteristics = {
      hlc: hlc !== null ? Math.round(hlc * 1000) / 1000 : null,
      hlcPerArea: hlc !== null ? Math.round((hlc * 1000 / building.area) * 100) / 100 : null,
      tau: tau !== null ? Math.round(tau * 10) / 10 : null,
      thermalMass: thermalMass !== null ? Math.round(thermalMass * 100) / 100 : null,
      thermalMassPerArea: thermalMass !== null ? Math.round((thermalMass * 1000 / building.area) * 10) / 10 : null,
      heatedHours,
      coolingPeriods,
      avgDeltaT: avgDeltaT !== null ? Math.round(avgDeltaT * 10) / 10 : null
    };

    return NextResponse.json({
      characteristics,
      buildingName: building.name,
      buildingArea: building.area,
      dataPoints: aligned.length,
      energyType: energyDevice?.energyType || 'unknown'
    });

  } catch (error) {
    console.error('Thermal characteristics API error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate thermal characteristics' },
      { status: 500 }
    );
  }
}