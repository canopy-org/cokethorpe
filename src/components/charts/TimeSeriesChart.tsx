'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface DataPoint {
  timestamp: string;
  value: number;
}

interface TimeSeriesChartProps {
  data: DataPoint[];
  title: string;
  unit: string;
  color?: string;
  loading?: boolean;
  height?: number; // added optional height
}

export default function TimeSeriesChart({ 
  data, 
  title, 
  unit, 
  color = '#3498db',
  loading = false,
  height = 300
}: TimeSeriesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const existing = echarts.getInstanceByDom(chartRef.current);
    if (!chartInstance.current || (existing && chartInstance.current !== existing)) {
      chartInstance.current = existing || echarts.init(chartRef.current);
    }
    if ((chartInstance.current as any)?.disposed) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // sort data by timestamp and convert to [time, value] pairs for time axis
    const sorted = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const seriesData = sorted.map(d => [new Date(d.timestamp).getTime(), d.value]);

    const rangeMs = sorted.length > 1
      ? new Date(sorted[sorted.length - 1].timestamp).getTime() - new Date(sorted[0].timestamp).getTime()
      : 0;

    // helper to format time based on span
    const fmt = (value: number) => {
      const f = (echarts.format as any)?.formatTime ?? ((pattern: string, t: number) => new Date(t).toLocaleString());
      if (rangeMs >= 1000 * 60 * 60 * 24 * 365) return f('yyyy-MM', value);
      if (rangeMs >= 1000 * 60 * 60 * 24 * 30) return f('yyyy-MM-dd', value);
      if (rangeMs >= 1000 * 60 * 60 * 24 * 7) return f('MMM dd', value);
      if (rangeMs >= 1000 * 60 * 60 * 24) return f('MMM dd\nHH:mm', value);
      if (rangeMs >= 1000 * 60 * 60) return f('MMM dd\nHH:mm', value);
      return f('HH:mm', value);
    };

    const option: echarts.EChartsOption = {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const val = Array.isArray(p.value) ? p.value[1] : p.value;
          const t = Array.isArray(p.value) ? p.value[0] : p.axisValue;
          const timeLabel = new Date(t).toLocaleString();
          return `${timeLabel}<br/>${p.seriesName}: ${val}${unit}`;
        }
      },
      grid: {
        left: '50px',
        right: '30px',
        top: '60px',
        bottom: '80px'
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: (value: number) => fmt(value),
          rotate: 0,
          fontSize: 11
        },
        axisPointer: {
          label: {
            formatter: (params: any) => {
              const v = params.value;
              return fmt(v);
            }
          }
        }
      },
      yAxis: {
        type: 'value',
        name: unit,
        nameLocation: 'middle',
        nameGap: 40,
        axisLabel: {
          formatter: `{value}${unit}`
        }
      },
      series: [
        {
          name: title,
          type: 'line',
          data: seriesData,
          smooth: true,
          encode: { x: 0, y: 1 },
          lineStyle: {
            color: color,
            width: 2
          },
          itemStyle: {
            color: color
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color + '40' },
              { offset: 1, color: color + '10' }
            ])
          }
        }
      ],
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
          realtime: true
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

    const inst = chartRef.current ? (echarts.getInstanceByDom(chartRef.current) || chartInstance.current) : chartInstance.current;
    if (!inst) return;

    if ((inst as any)?.disposed) {
      chartInstance.current = echarts.init(chartRef.current!);
      chartInstance.current.setOption(option);
    } else {
      inst.setOption(option);
      chartInstance.current = inst;
    }

    const handleResize = () => { chartInstance.current?.resize(); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data, title, unit, color, height]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { chartInstance.current?.dispose(); } catch {}
      chartInstance.current = null;
    };
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded" style={{ width: '100%' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded" style={{ width: '100%' }}>
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  return <div ref={chartRef} style={{ width: '100%', height: `${height}px`, maxWidth: '100%' }} />;
}