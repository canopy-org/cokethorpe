import { NextRequest, NextResponse } from 'next/server';
import { queryInfluxDB, buildHistoricalRateFluxQuery, influxConfig } from '@/lib/influxdb';
import { getAllGasDevices, getAllOilDevices, getSiteElectricityDevice } from '@/lib/buildings';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const timeRange = searchParams.get('timeRange') || '-24h';
  const interval = searchParams.get('interval') || '15m';
  const stopTime = searchParams.get('stopTime') || undefined;

  try {
    const gasTimeMap = new Map<string, number>();
    const oilTimeMap = new Map<string, number>();

    // Fetch electricity from site meter
    let electricityValue: number | null = null;
    const electricityDevice = getSiteElectricityDevice();
    if (electricityDevice) {
      const elecQuery = buildHistoricalRateFluxQuery(
        influxConfig.bucket,
        'alldata',
        'water',
        timeRange,
        interval,
        electricityDevice.deviceId,
        stopTime
      );
      const elecCsv = await queryInfluxDB(elecQuery);
      const elecData = parseHistoricalCSV(elecCsv);

      if (elecData.length > 0) {
        const totalPulses = elecData.reduce((sum, point) => sum + point.value, 0);
        electricityValue = totalPulses * (electricityDevice.conversionFactor || 1);
      }
    }

    // Fetch gas from all buildings
    const gasDevices = getAllGasDevices();
    const oilDevices = getAllOilDevices();
    const breakdownMap = new Map<string, {
      buildingId: string;
      buildingName: string;
      gasUsage: number | null;
      oilUsage: number | null;
    }>();

    let totalGasValue = 0;
    for (const device of gasDevices) {
      const gasQuery = buildHistoricalRateFluxQuery(
        influxConfig.bucket,
        'alldata',
        'water',
        timeRange,
        interval,
        device.deviceId,
        stopTime
      );
      const gasCsv = await queryInfluxDB(gasQuery);
      const gasData = parseHistoricalCSV(gasCsv);

      let gasUsage: number | null = null;
      if (gasData.length > 0) {
        const totalPulses = gasData.reduce((sum, point) => sum + point.value, 0);
        gasUsage = totalPulses * (device.conversionFactor ?? 1);
        totalGasValue += gasUsage;

        const cf = device.conversionFactor ?? 1;
        gasData.forEach(pt => {
          gasTimeMap.set(pt.timestamp, (gasTimeMap.get(pt.timestamp) || 0) + (pt.value * cf));
        });
      }

      const entry = breakdownMap.get(device.buildingId) ?? {
        buildingId: device.buildingId,
        buildingName: device.buildingName,
        gasUsage: null,
        oilUsage: null
      };
      entry.gasUsage = (entry.gasUsage || 0) + (gasUsage || 0) || null;
      breakdownMap.set(device.buildingId, entry);
    }

    let totalOilValue = 0;
    for (const device of oilDevices) {
      const oilQuery = buildHistoricalRateFluxQuery(
        influxConfig.bucket,
        'alldata',
        'water',
        timeRange,
        interval,
        device.deviceId,
        stopTime
      );
      const oilCsv = await queryInfluxDB(oilQuery);
      const oilData = parseHistoricalCSV(oilCsv);

      let oilUsage: number | null = null;
      if (oilData.length > 0) {
        const totalPulses = oilData.reduce((sum, point) => sum + point.value, 0);
        oilUsage = totalPulses * (device.conversionFactor ?? 1);
        totalOilValue += oilUsage;

        const cf = device.conversionFactor ?? 1;
        oilData.forEach(pt => {
          oilTimeMap.set(pt.timestamp, (oilTimeMap.get(pt.timestamp) || 0) + (pt.value * cf));
        });
      }

      const entry = breakdownMap.get(device.buildingId) ?? {
        buildingId: device.buildingId,
        buildingName: device.buildingName,
        gasUsage: null,
        oilUsage: null
      };
      entry.oilUsage = (entry.oilUsage || 0) + (oilUsage || 0) || null;
      breakdownMap.set(device.buildingId, entry);
    }

    const buildSeriesFromMap = (m: Map<string, number>) => {
      const arr = Array.from(m.entries()).map(([timestamp, value]) => ({ timestamp, value }));
      arr.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return arr;
    };

    const buildingBreakdown = Array.from(breakdownMap.values()).sort((a, b) =>
      ((b.gasUsage || 0) + (b.oilUsage || 0)) - ((a.gasUsage || 0) + (a.oilUsage || 0))
    );

    return NextResponse.json({
      totalGas: totalGasValue > 0 ? totalGasValue : null,
      totalOil: totalOilValue > 0 ? totalOilValue : null,
      totalElectricity: electricityValue,
      buildingBreakdown,
      timeSeries: {
        gas: buildSeriesFromMap(gasTimeMap),
        oil: buildSeriesFromMap(oilTimeMap)
      }
    });
  } catch (error) {
    console.error('Site energy API error:', error);
    return NextResponse.json({ error: 'Failed to fetch site energy data' }, { status: 500 });
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