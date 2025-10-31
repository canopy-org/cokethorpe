'use client';

import { useState, useEffect, useRef } from 'react';
import DateRangePicker from '@/components/charts/DateRangePicker';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useHistoricalEnergyData } from '@/hooks/useHistoricalEnergyData';
import { getPrimarySensorDevice } from '@/lib/buildings';
import * as echarts from 'echarts';

interface BuildingChartsProps {
  buildingId: string;
}

function CombinedMetricsChart({
  buildingId,
  timeRange,
  interval
}: {
  buildingId: string;
  timeRange: string;
  interval: string;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const tempDeviceId = getPrimarySensorDevice(buildingId, 'temperature');
  const humidityDeviceId = getPrimarySensorDevice(buildingId, 'humidity');
  const energyDeviceId = getPrimarySensorDevice(buildingId, 'energy');

  const { data: tempData, loading: tempLoading } = useHistoricalData('temperature', timeRange, interval, tempDeviceId);
  const { data: humidityData, loading: humidityLoading } = useHistoricalData('humidity', timeRange, interval, humidityDeviceId);
  const { data: energyData, loading: energyLoading } = useHistoricalEnergyData(
    buildingId, 
    timeRange, 
    interval, 
    energyDeviceId,
    'rate'
  );

  const loading = tempLoading || humidityLoading || energyLoading;

  useEffect(() => {
    if (!chartRef.current || loading) return;

    // Initialize chart only once
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Get all unique timestamps
    const allTimestamps = new Set<string>();
    tempData.forEach(d => allTimestamps.add(d.timestamp));
    humidityData.forEach(d => allTimestamps.add(d.timestamp));
    energyData.forEach(d => allTimestamps.add(d.timestamp));

    const timestamps = Array.from(allTimestamps).sort();

    // Prepare series data and yAxis together so indices match
    const series: echarts.SeriesOption[] = [];
    const yAxis: echarts.YAXisComponentOption[] = [];

    // track how many right-side axes to compute offsets
    let rightAxisCount = 0;

    const addMetric = (
      deviceId: string | undefined,
      data: { timestamp: string; value: number }[],
      name: string,
      unitName: string,
      color: string,
      position: 'left' | 'right'
    ) => {
      if (!deviceId || data.length === 0) return;

      const axisIndex = yAxis.length;

      // compute offset for right-side axes (space them so they don't overlap)
      let offset = 0;
      if (position === 'right') {
        offset = rightAxisCount > 0 ? 60 * rightAxisCount : 0;
        rightAxisCount += 1;
      }

      yAxis.push({
        type: 'value',
        name: `${name} ${unitName}`,
        position,
        offset,
        axisLabel: {
          formatter: position === 'left' ? (position === 'left' ? (unitName.includes('°') ? '{value}°C' : `{value}${unitName}`) : `{value}${unitName}`) : `{value}${unitName}`,
          color
        },
        axisLine: {
          lineStyle: {
            color
          }
        },
        splitLine: {
          show: name === 'Energy',
          lineStyle: {
            type: 'dashed',
            opacity: 0.3
          }
        }
      });

      series.push({
        name,
        type: 'line',
        yAxisIndex: axisIndex,
        data: data.map(d => d.value),
        smooth: true,
        lineStyle: {
          color,
          width: 2
        },
        itemStyle: {
          color
        },
        symbol: 'circle',
        symbolSize: 6
      });
    };

    // Add metrics in desired order and with proper positions
    addMetric(tempDeviceId, tempData, 'Temperature', '(°C)', '#e74c3c', 'left');
    addMetric(humidityDeviceId, humidityData, 'Humidity', '(%)', '#3498db', 'right');
    addMetric(energyDeviceId, energyData, 'Energy', '(kWh)', '#f39c12', 'right');

    const option: echarts.EChartsOption = {
      title: {
        text: `Building Metrics (${timeRange.replace('-', 'Last ')})`,
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          let tooltip = `<strong>${params[0].axisValue}</strong><br/>`;
          params.forEach((param: any) => {
            // safe value extraction
            const rawVal = param.value;
            const val =
              typeof rawVal === 'number'
                ? rawVal
                : Array.isArray(rawVal)
                ? (rawVal[1] ?? rawVal[0])
                : Number(rawVal) || 0;

            const unit = param.seriesName === 'Temperature' ? '°C' :
                        param.seriesName === 'Humidity' ? '%' : 'kWh';
            tooltip += `${param.marker} ${param.seriesName}: ${val.toFixed(2)}${unit}<br/>`;
          });
          return tooltip;
        }
      },
      legend: {
        data: series.map(s => (s as any).name),
        top: 40,
        left: 'center'
      },
      grid: {
        left: '60px',
        right: yAxis.length > 2 ? '140px' : '80px',
        top: '100px',
        bottom: '100px',
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        axisLabel: {
          rotate: 45,
          fontSize: 10
        },
        boundaryGap: false
      },
      yAxis,
      series,
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          height: 20,
          bottom: 10
        }
      ]
    };

    chartInstance.current.setOption(option, true);

    // Handle window resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [tempData, humidityData, energyData, timeRange, loading, buildingId]);

  // Cleanup on unmount ONLY
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  const hasData = tempData.length > 0 || humidityData.length > 0 || energyData.length > 0;

  if (!hasData) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  return <div ref={chartRef} style={{ width: '100%', height: '500px' }} />;
}

export default function BuildingCharts({ buildingId }: BuildingChartsProps) {
  const [timeRange, setTimeRange] = useState('-24h');

  const getInterval = (range: string): string => {
    if (range === '-1h') return '1m';
    if (range === '-6h') return '5m';
    if (range === '-24h') return '15m';
    if (range === '-7d') return '1h';
    if (range === '-30d') return '6h';
    return '1d';
  };

  const interval = getInterval(timeRange);

  return (
    <div>
      <DateRangePicker value={timeRange} onChange={setTimeRange} />

      {/* Combined Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <CombinedMetricsChart 
          buildingId={buildingId} 
          timeRange={timeRange} 
          interval={interval} 
        />
      </div>
    </div>
  );
}