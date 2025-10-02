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
}

export default function TimeSeriesChart({ 
  data, 
  title, 
  unit, 
  color = '#3498db',
  loading = false 
}: TimeSeriesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Prepare data
    const timestamps = data.map(d => d.timestamp);
    const values = data.map(d => d.value);

    // Chart configuration
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
        formatter: (params: any) => {
          const param = params[0];
          return `${param.axisValue}<br/>${param.seriesName}: ${param.value}${unit}`;
        }
      },
      grid: {
        left: '50px',
        right: '30px',
        top: '60px',
        bottom: '80px'
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        axisLabel: {
          rotate: 45,
          fontSize: 10
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
          data: values,
          smooth: true,
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

    chartInstance.current.setOption(option);

    // Handle window resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, title, unit, color]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  return <div ref={chartRef} style={{ width: '100%', height: '300px' }} />;
}