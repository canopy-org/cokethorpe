'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export interface MetricConfig {
  name: string;
  data: { timestamp: string; value: number }[];
  unit: string;
  color: string;
  position: 'left' | 'right';
  chartType?: 'line' | 'bar' | 'auto'; // 'auto' follows aggregation rules
  alwaysLine?: boolean; // Forces line chart regardless of aggregation (for temp/humidity)
  showAreaShading?: boolean; // Show gradient area under line charts
  axisId?: string;  // Add this - metrics with same axisId share an axis
}

interface MultiMetricChartProps {
  title: string;
  metrics: MetricConfig[];
  period: 'day' | 'month' | 'year';
  date: string;
  aggregation: 'hourly' | 'daily' | 'monthly';
  loading?: boolean;
  height?: number;
}

export default function MultiMetricChart({
  title,
  metrics,
  period,
  date,
  aggregation,
  loading = false,
  height = 500
}: MultiMetricChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || loading) return;

    // Initialize chart only once
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Generate complete time range based on period
    const getTimeRangeAndInterval = () => {
      let startDate: Date;
      let endDate: Date;

      // Ensure date is in correct format
      let formattedDate = date;
      if (period === 'day') {
        if (date.length === 7) formattedDate = `${date}-01`;
        else if (date.length === 4) formattedDate = `${date}-01-01`;
      } else if (period === 'month') {
        if (date.length === 10) formattedDate = date.slice(0, 7);
        else if (date.length === 4) formattedDate = `${date}-01`;
      } else {
        if (date.length === 10) formattedDate = date.slice(0, 4);
        else if (date.length === 7) formattedDate = date.slice(0, 4);
      }

      if (period === 'day') {
        startDate = new Date(formattedDate + 'T00:00:00Z');
        endDate = new Date(formattedDate + 'T23:59:59Z');
      } else if (period === 'month') {
        const [year, month] = formattedDate.split('-').map(Number);
        startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
        endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
      } else {
        const year = parseInt(formattedDate);
        startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
        endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
      }

      return { startDate, endDate };
    };

    const { startDate, endDate } = getTimeRangeAndInterval();

    // Generate complete x-axis timestamps
    const generateCompleteTimestamps = () => {
      const timestamps: string[] = [];
      const current = new Date(startDate);

      if (aggregation === 'hourly') {
        while (current <= endDate) {
          timestamps.push(current.toISOString());
          current.setHours(current.getHours() + 1);
        }
      } else if (aggregation === 'daily') {
        while (current <= endDate) {
          timestamps.push(current.toISOString());
          current.setDate(current.getDate() + 1);
        }
      } else {
        while (current <= endDate) {
          timestamps.push(current.toISOString());
          current.setMonth(current.getMonth() + 1);
        }
      }

      return timestamps;
    };

    const timestamps = generateCompleteTimestamps();

    // Determine chart type for a metric
    const getChartType = (metric: MetricConfig): 'line' | 'bar' => {
      if (metric.alwaysLine) return 'line';
      if (metric.chartType === 'line') return 'line';
      if (metric.chartType === 'bar') return 'bar';
      // 'auto' follows aggregation
      return aggregation === 'hourly' ? 'line' : 'bar';
    };

    // Build yAxis and series
const yAxis: any[] = [];
const series: any[] = [];
const axisMap = new Map<string, number>(); // Maps axisId to yAxisIndex
let rightAxisCount = 0;
let leftAxisCount = 0;

metrics.forEach((metric) => {
  if (metric.data.length === 0) return;

  const chartType = getChartType(metric);
  
  // Determine axis ID - use explicit axisId or generate one from name
  const axisId = metric.axisId || metric.name;
  
  // Check if we already have an axis for this axisId
  let axisIndex: number;
  
  if (axisMap.has(axisId)) {
    // Reuse existing axis
    axisIndex = axisMap.get(axisId)!;
  } else {
    // Create new axis
    axisIndex = yAxis.length;
    axisMap.set(axisId, axisIndex);
    
    // Calculate offset
    let offset = 0;
    if (metric.position === 'right') {
      offset = rightAxisCount > 0 ? 60 * rightAxisCount : 0;
      rightAxisCount += 1;
    } else {
      offset = leftAxisCount > 0 ? 60 * leftAxisCount : 0;
      leftAxisCount += 1;
    }

    // Add y-axis
    yAxis.push({
      type: 'value',
      name: `${metric.unit}`,  // Simplified name since it's shared
      position: metric.position,
      offset,
      axisLabel: {
        formatter: `{value}`,
        color: '#666'  // Neutral color for shared axis
      },
      axisLine: {
        lineStyle: {
          color: '#666'
        }
      },
      splitLine: {
        show: metric.position === 'left' && leftAxisCount === 1,
        lineStyle: {
          type: 'dashed',
          opacity: 0.3
        }
      }
    });
  }

  // Create value map and map to timestamps (keep existing logic)
  const valueMap = new Map<string, number>();
  metric.data.forEach(d => {
    const dataDate = new Date(d.timestamp);
    if (aggregation === 'hourly') {
      dataDate.setMinutes(0, 0, 0);
    } else if (aggregation === 'daily') {
      dataDate.setHours(0, 0, 0, 0);
    } else {
      dataDate.setDate(1);
      dataDate.setHours(0, 0, 0, 0);
    }
    valueMap.set(dataDate.toISOString(), d.value);
  });

  const values = timestamps.map(t => {
    const normalizedDate = new Date(t);
    if (aggregation === 'hourly') {
      normalizedDate.setMinutes(0, 0, 0);
    } else if (aggregation === 'daily') {
      normalizedDate.setHours(0, 0, 0, 0);
    } else {
      normalizedDate.setDate(1);
      normalizedDate.setHours(0, 0, 0, 0);
    }
    return valueMap.get(normalizedDate.toISOString()) ?? null;
  });

  // Add series
  const seriesConfig: any = {
    name: metric.name,
    type: chartType,
    yAxisIndex: axisIndex,
    data: values,
    smooth: chartType === 'line',
    itemStyle: {
      color: metric.color
    }
  };

  if (chartType === 'line') {
    seriesConfig.lineStyle = {
      color: metric.color,
      width: 2
    };
    seriesConfig.symbol = 'circle';
    seriesConfig.symbolSize = 6;

    if (metric.showAreaShading) {
      seriesConfig.areaStyle = {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: metric.color + '40' },
          { offset: 1, color: metric.color + '10' }
        ])
      };
    }
  } else {
    seriesConfig.barMaxWidth = 40;
  }

  series.push(seriesConfig);
});

    // Check if any series is a bar chart for boundaryGap
    const hasBarChart = series.some(s => s.type === 'bar');

    // Format title based on period
    let formattedTitle = title;
    if (period === 'day') {
      const dateObj = new Date(date);
      formattedTitle += ` - ${dateObj.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`;
    } else if (period === 'month') {
      const [year, month] = date.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1);
      formattedTitle += ` - ${dateObj.toLocaleDateString('en-GB', { 
        year: 'numeric', 
        month: 'long' 
      })}`;
    } else {
      formattedTitle += ` - ${date}`;
    }

    const option: echarts.EChartsOption = {
      title: {
        text: formattedTitle,
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: hasBarChart ? 'shadow' : 'cross'
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const date = new Date(params[0].axisValue);
          
          let timeStr = '';
          if (aggregation === 'hourly') {
            timeStr = `${String(date.getHours()).padStart(2, '0')}:00`;
          } else if (aggregation === 'daily') {
            timeStr = date.toLocaleDateString('en-GB');
          } else {
            timeStr = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
          }
          
          let tooltip = `<strong>${timeStr}</strong><br/>`;
          params.forEach((param: any) => {
            if (param.value === null || param.value === undefined) return;
            
            // Safely extract the value
            let val: number;
            if (typeof param.value === 'number') {
              val = param.value;
            } else if (Array.isArray(param.value)) {
              val = param.value[1] ?? param.value[0] ?? 0;
            } else {
              val = 0;
            }

            // Find the metric config for this series to get the unit
            const metric = metrics.find(m => m.name === param.seriesName);
            const unit = metric?.unit || '';
            
            tooltip += `${param.marker} ${param.seriesName}: ${val.toFixed(2)}${unit}<br/>`;
          });
          return tooltip;
        }
      },
      legend: {
        data: series.map(s => s.name),
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
          rotate: aggregation === 'hourly' && period !== 'day' ? 45 : 0,
          fontSize: 10,
          formatter: (value: string) => {
            const date = new Date(value);
            if (isNaN(date.getTime())) return String(value);

            if (aggregation === 'hourly') {
              const hh = String(date.getHours()).padStart(2, '0');
              if (period === 'day') {
                return `${hh}:00`;
              } else {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                return `${day}/${month} ${hh}:00`;
              }
            } else if (aggregation === 'daily') {
              const day = String(date.getDate()).padStart(2, '0');
              if (period === 'month') {
                return day;
              } else {
                const month = String(date.getMonth() + 1).padStart(2, '0');
                return `${day}/${month}`;
              }
            } else {
              return date.toLocaleDateString('en-GB', { month: 'short' });
            }
          }
        },
        boundaryGap: hasBarChart
      },
      yAxis,
      series,
      dataZoom: timestamps.length > 50 ? [
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
      ] : []
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
  }, [metrics, title, period, date, aggregation, loading, height]);

  // Cleanup on unmount
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
      <div style={{ height: `${height}px` }} className="flex items-center justify-center bg-gray-50 rounded">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  const hasData = metrics.some(m => m.data.length > 0);

  if (!hasData) {
    return (
      <div style={{ height: `${height}px` }} className="flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  return <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />;
}