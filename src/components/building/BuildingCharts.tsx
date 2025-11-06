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
  period,
  date,
  aggregation
}: {
  buildingId: string;
  period: 'day' | 'month' | 'year';
  date: string;
  aggregation: 'hourly' | 'daily' | 'monthly';
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const tempDeviceId = getPrimarySensorDevice(buildingId, 'temperature');
  const humidityDeviceId = getPrimarySensorDevice(buildingId, 'humidity');
  const energyDeviceId = getPrimarySensorDevice(buildingId, 'energy');

  // Calculate time range and interval based on period and aggregation
  const getTimeRangeAndInterval = () => {
    let startDate: Date;
    let endDate: Date;
    let interval: string;

    // Ensure date is in correct format for the period
    let formattedDate = date;
    if (period === 'day') {
      // Ensure YYYY-MM-DD format
      if (date.length === 7) {
        formattedDate = `${date}-01`; // YYYY-MM -> YYYY-MM-01
      } else if (date.length === 4) {
        formattedDate = `${date}-01-01`; // YYYY -> YYYY-01-01
      }
    } else if (period === 'month') {
      // Ensure YYYY-MM format
      if (date.length === 10) {
        formattedDate = date.slice(0, 7); // YYYY-MM-DD -> YYYY-MM
      } else if (date.length === 4) {
        formattedDate = `${date}-01`; // YYYY -> YYYY-01
      }
    } else {
      // Ensure YYYY format
      if (date.length === 10) {
        formattedDate = date.slice(0, 4); // YYYY-MM-DD -> YYYY
      } else if (date.length === 7) {
        formattedDate = date.slice(0, 4); // YYYY-MM -> YYYY
      }
    }

    if (period === 'day') {
      // For a day, show 00:00 to 23:59
      startDate = new Date(formattedDate + 'T00:00:00Z');
      endDate = new Date(formattedDate + 'T23:59:59Z');
      interval = aggregation === 'hourly' ? '1h' : '1d';
    } else if (period === 'month') {
      // For a month, show first day to last day
      const [year, month] = formattedDate.split('-').map(Number);
      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59)); // Last day of month
      
      if (aggregation === 'hourly') {
        interval = '1h';
      } else if (aggregation === 'daily') {
        interval = '1d';
      } else {
        interval = '1d'; // Should not happen as monthly is disabled for month period
      }
    } else {
      // For a year, show Jan 1 to Dec 31
      const year = parseInt(formattedDate);
      startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
      
      if (aggregation === 'hourly') {
        interval = '1h';
      } else if (aggregation === 'daily') {
        interval = '1d';
      } else {
        interval = '1M'; // Monthly
      }
    }

    return { startDate, endDate, interval };
  };

  const { startDate, endDate, interval } = getTimeRangeAndInterval();

  // Format times for InfluxDB (as ISO strings for absolute times)
  const startTime = startDate.toISOString();
  const stopTime = endDate.toISOString();

  const { data: tempData, loading: tempLoading } = useHistoricalData('temperature', startTime, interval, tempDeviceId, stopTime);
  const { data: humidityData, loading: humidityLoading } = useHistoricalData('humidity', startTime, interval, humidityDeviceId, stopTime);
  const { data: energyData, loading: energyLoading } = useHistoricalEnergyData(
    buildingId, 
    startTime, 
    interval, 
    energyDeviceId,
    'rate',
    stopTime
  );

  const loading = tempLoading || humidityLoading || energyLoading;

  useEffect(() => {
    if (!chartRef.current || loading) return;

    // Initialize chart only once
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Generate complete x-axis based on period and aggregation
    const generateCompleteTimestamps = () => {
      const timestamps: string[] = [];
      const current = new Date(startDate);

      if (aggregation === 'hourly') {
        // Generate hourly timestamps
        while (current <= endDate) {
          timestamps.push(current.toISOString());
          current.setHours(current.getHours() + 1);
        }
      } else if (aggregation === 'daily') {
        // Generate daily timestamps
        while (current <= endDate) {
          timestamps.push(current.toISOString());
          current.setDate(current.getDate() + 1);
        }
      } else {
        // Generate monthly timestamps
        while (current <= endDate) {
          timestamps.push(current.toISOString());
          current.setMonth(current.getMonth() + 1);
        }
      }

      return timestamps;
    };

    const timestamps = generateCompleteTimestamps();

    // Initialize arrays and counter
    const yAxis: any[] = [];
    const series: any[] = [];
    let rightAxisCount = 0;

    // Determine chart type based on aggregation
    const chartType = aggregation === 'hourly' ? 'line' : 'bar';

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
      
      // Create a map of timestamps to values
      const valueMap = new Map<string, number>();
      data.forEach(d => {
        // Normalize timestamp to match our generated timestamps
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

      // Map values to the complete timestamps (null for missing data)
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

      // compute offset for right-side axes
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
          formatter: `{value}${unitName}`,
          color
        },
        axisLine: {
          lineStyle: {
            color
          }
        },
        splitLine: {
          show: name === 'Energy' || name === 'Power',
          lineStyle: {
            type: 'dashed',
            opacity: 0.3
          }
        }
      });

      series.push({
        name,
        type: chartType,
        yAxisIndex: axisIndex,
        data: values,
        smooth: chartType === 'line',
        lineStyle: chartType === 'line' ? {
          color,
          width: 2
        } : undefined,
        itemStyle: {
          color
        },
        symbol: chartType === 'line' ? 'circle' : undefined,
        symbolSize: chartType === 'line' ? 6 : undefined,
        barMaxWidth: 40
      });
    };

    // Convert energy to power for hourly view
    const processedEnergyData = aggregation === 'hourly' 
      ? energyData.map(d => ({
          ...d,
          value: d.value // Energy in kWh for 1 hour = Power in kW
        }))
      : energyData;

    const energyLabel = aggregation === 'hourly' ? 'Power' : 'Energy';
    const energyUnit = aggregation === 'hourly' ? '(kW)' : '(kWh)';

    // Add metrics in desired order and with proper positions
    addMetric(tempDeviceId, tempData, 'Temperature', '(°C)', '#e74c3c', 'left');
    addMetric(humidityDeviceId, humidityData, 'Humidity', '(%)', '#3498db', 'right');
    addMetric(energyDeviceId, processedEnergyData, energyLabel, energyUnit, '#f39c12', 'right');

    // Format title based on period
    let title = '';
    if (period === 'day') {
      const dateObj = new Date(date);
      title = `Building Metrics - ${dateObj.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`;
    } else if (period === 'month') {
      const [year, month] = date.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1);
      title = `Building Metrics - ${dateObj.toLocaleDateString('en-GB', { 
        year: 'numeric', 
        month: 'long' 
      })}`;
    } else {
      title = `Building Metrics - ${date}`;
    }

    const option: echarts.EChartsOption = {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: chartType === 'line' ? 'cross' : 'shadow'
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
            if (param.value === null) return;
            
            const rawVal = param.value;
            const val = typeof rawVal === 'number' ? rawVal : 
                       Array.isArray(rawVal) ? (rawVal[1] ?? rawVal[0]) : 
                       Number(rawVal) || 0;

            const unit = param.seriesName === 'Temperature' ? '°C' :
                        param.seriesName === 'Humidity' ? '%' : 
                        param.seriesName === 'Power' ? 'kW' : 'kWh';
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
        boundaryGap: chartType === 'bar'
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
  }, [energyDeviceId, humidityDeviceId, tempDeviceId, tempData, humidityData, energyData, period, date, aggregation, loading, buildingId, interval, startTime, stopTime]);

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
        <p className="text-gray-400">No data available for this period</p>
      </div>
    );
  }

  return <div ref={chartRef} style={{ width: '100%', height: '500px' }} />;
}

export default function BuildingCharts({ buildingId }: BuildingChartsProps) {
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [aggregation, setAggregation] = useState<'hourly' | 'daily' | 'monthly'>('hourly');

  // Update date format when period changes
  const handlePeriodChange = (newPeriod: 'day' | 'month' | 'year') => {
    setPeriod(newPeriod);
    
    const today = new Date();
    if (newPeriod === 'day') {
      setDate(today.toISOString().split('T')[0]); // YYYY-MM-DD
      setAggregation('hourly'); // Reset to hourly for day view
    } else if (newPeriod === 'month') {
      setDate(today.toISOString().slice(0, 7)); // YYYY-MM
      if (aggregation === 'monthly') {
        setAggregation('daily'); // Switch away from monthly
      }
    } else {
      setDate(today.getFullYear().toString()); // YYYY
      // Keep current aggregation as all are valid for year
    }
  };

  return (
    <div>
      <DateRangePicker 
        period={period}
        date={date}
        aggregation={aggregation}
        onPeriodChange={handlePeriodChange}
        onDateChange={setDate}
        onAggregationChange={setAggregation}
      />

      {/* Combined Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <CombinedMetricsChart 
          buildingId={buildingId} 
          period={period}
          date={date}
          aggregation={aggregation}
        />
      </div>
    </div>
  );
}