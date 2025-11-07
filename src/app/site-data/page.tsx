'use client';

import { useSiteEnergyData } from '@/hooks/useSiteEnergyData';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { getBuildingById, siteConfig } from '@/lib/buildings';
import DateRangePicker from '@/components/charts/DateRangePicker';

function SiteMetricCard({ 
  title, 
  value, 
  unit, 
  color, 
  icon,
  period,
  date
}: { 
  title: string; 
  value: number | null; 
  unit: string; 
  color: string;
  icon: string;
  period: 'day' | 'month' | 'year';
  date: string;
}) {
  const getPeriodLabel = () => {
    if (period === 'day') {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-GB', { 
        weekday: 'short',
        day: 'numeric', 
        month: 'short',
        year: 'numeric' 
      });
    } else if (period === 'month') {
      const [year, month] = date.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1);
      return dateObj.toLocaleDateString('en-GB', { 
        month: 'long',
        year: 'numeric' 
      });
    } else {
      return date;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</h3>
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-5xl font-bold" style={{ color: color }}>
        {value !== null ? value.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '--'}
        <span className="text-2xl ml-2">{unit}</span>
      </p>
      <p className="text-xs text-gray-400 mt-2">{getPeriodLabel()}</p>
    </div>
  );
}

type ChartDisplayMode = 'absolute' | 'normalized';

function BuildingComparisonChart({ 
  data,
  period,
  date
}: { 
  data: { buildingId: string; buildingName: string; gasUsage?: number | null; oilUsage?: number | null }[];
  period: 'day' | 'month' | 'year';
  date: string;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [displayMode, setDisplayMode] = useState<ChartDisplayMode>('absolute');

  const getPeriodLabel = () => {
    if (period === 'day') {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric' 
      });
    } else if (period === 'month') {
      const [year, month] = date.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1);
      return dateObj.toLocaleDateString('en-GB', { 
        month: 'long',
        year: 'numeric' 
      });
    } else {
      return date;
    }
  };

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart only once
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Filter out null/zero combined values and prepare data (use gas + oil)
    const validData = data
      .map(d => ({ ...d, combined: (d.gasUsage || 0) + (d.oilUsage || 0) }))
      .filter(d => d.combined > 0);

    if (validData.length === 0) {
      // Clear the chart if no data
      chartInstance.current.clear();
      return;
    }

    // Calculate values based on display mode
    const chartData = validData.map(d => {
      const building = getBuildingById(d.buildingId);
      if (displayMode === 'normalized' && building && building.area > 0) {
        return {
          name: d.buildingName,
          value: d.combined / building.area
        };
      }
      return {
        name: d.buildingName,
        value: d.combined
      };
    });

    // Sort by value (descending)
    chartData.sort((a, b) => b.value - a.value);

    const buildingNames = chartData.map(d => d.name);
    const values = chartData.map(d => d.value);

    const unit = displayMode === 'normalized' ? 'kWh/m²' : 'kWh';
    const title = displayMode === 'normalized' 
      ? `Normalized Gas + Oil by Building (${getPeriodLabel()})`
      : `Gas + Oil by Building (${getPeriodLabel()})`;

    // Chart configuration
    const option: echarts.EChartsOption = {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const param = params[0];
          const formattedValue = param.value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          return `${param.name}<br/>Gas + Oil: ${formattedValue} ${unit}`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '80px',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: `Energy (${unit})`,
        nameLocation: 'middle',
        nameGap: 40,
        axisLabel: {
          formatter: (value: number) => value.toLocaleString('en-US')
        }
      },
      yAxis: {
        type: 'category',
        data: buildingNames,
        axisLabel: {
          fontSize: 12,
          interval: 0
        },
        axisTick: {
          alignWithLabel: true
        }
      },
      series: [
        {
          name: 'Gas + Oil',
          type: 'bar',
          data: values,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#f39c12' },
              { offset: 1, color: '#e67e22' }
            ]),
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            formatter: (params: any) => {
              const formattedValue = params.value.toLocaleString('en-US', {
                minimumFractionDigits: displayMode === 'normalized' ? 2 : 0,
                maximumFractionDigits: displayMode === 'normalized' ? 2 : 0
              });
              return `${formattedValue} ${unit}`;
            },
            fontSize: 11
          },
          barMaxWidth: 40
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
  }, [data, period, date, displayMode]);

  // Cleanup on unmount ONLY
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  // Check if we have any valid data
  const validData = data.map(d => ({ ...d, combined: (d.gasUsage || 0) + (d.oilUsage || 0) })).filter(d => d.combined > 0);

  if (data.length === 0 || validData.length === 0) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded border-2 border-gray-200">
        <div className="text-center p-6">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600 font-semibold mb-2">No Gas + Oil Usage Data Available</p>
          <p className="text-gray-500 text-sm">
            {data.length === 0 
              ? 'No buildings configured' 
              : `${data.length} buildings found, but no gas or oil usage data for the selected period`}
          </p>
          <p className="text-gray-400 text-xs mt-2">Try selecting a different time period</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Showing {validData.length} of {data.length} buildings with gas or oil usage data
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Display Mode:</label>
          <select
            value={displayMode}
            onChange={(e) => setDisplayMode(e.target.value as ChartDisplayMode)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm font-medium"
          >
            <option value="absolute">Energy Usage (kWh)</option>
            <option value="normalized">Normalized (kWh/m²)</option>
          </select>
        </div>
      </div>
      <div ref={chartRef} style={{ width: '100%', height: '600px' }} />
    </div>
  );
}

function SiteTimeSeriesChart({
  energyData,
  temperatureData,
  period,
  date,
  aggregation,
  loading
}: {
  energyData: { timestamp: string; value: number }[];
  temperatureData: { timestamp: string; value: number }[];
  period: 'day' | 'month' | 'year';
  date: string;
  aggregation: 'hourly' | 'daily' | 'monthly';
  loading: boolean;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || loading) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Determine if showing power or energy
    const isPower = aggregation === 'hourly';
    const energyLabel = isPower ? 'Power' : 'Fossil Fuel';
    const energyUnit = isPower ? 'kW' : 'kWh';
    const energyChartType = isPower ? 'line' : 'bar';

    // Format title based on period
    let title = '';
    if (period === 'day') {
      const dateObj = new Date(date);
      title = `Site Energy & Temperature - ${dateObj.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`;
    } else if (period === 'month') {
      const [year, month] = date.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1);
      title = `Site Energy & Temperature - ${dateObj.toLocaleDateString('en-GB', { 
        year: 'numeric', 
        month: 'long' 
      })}`;
    } else {
      title = `Site Energy & Temperature - ${date}`;
    }

    // Get all unique timestamps
    const timestamps = new Set<string>();
    energyData.forEach(d => timestamps.add(d.timestamp));
    temperatureData.forEach(d => timestamps.add(d.timestamp));
    
    const sortedTimestamps = Array.from(timestamps).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );

    // Map data to timestamps
    const energyMap = new Map(energyData.map(d => [d.timestamp, d.value]));
    const tempMap = new Map(temperatureData.map(d => [d.timestamp, d.value]));

    const energyValues = sortedTimestamps.map(t => energyMap.get(t) ?? null);
    const tempValues = sortedTimestamps.map(t => tempMap.get(t) ?? null);

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
          type: energyChartType === 'bar' ? 'shadow' : 'cross'
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
            
            const unit = param.seriesName === 'OAT' ? '°C' : energyUnit;
            tooltip += `${param.marker} ${param.seriesName}: ${val.toFixed(2)}${unit}<br/>`;
          });
          return tooltip;
        }
      },
      legend: {
        data: [energyLabel, 'OAT'],
        top: 40,
        left: 'center'
      },
      grid: {
        left: '60px',
        right: '80px',
        top: '100px',
        bottom: '100px',
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: sortedTimestamps,
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
        boundaryGap: energyChartType === 'bar'
      },
      yAxis: [
        {
          type: 'value',
          name: `${energyLabel} (${energyUnit})`,
          position: 'left',
          axisLabel: {
            formatter: `{value}`,
            color: '#c2410c'
          },
          axisLine: {
            lineStyle: {
              color: '#c2410c'
            }
          },
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dashed',
              opacity: 0.3
            }
          }
        },
        {
          type: 'value',
          name: 'Temperature (°C)',
          position: 'right',
          axisLabel: {
            formatter: '{value}°C',
            color: '#3498db'
          },
          axisLine: {
            lineStyle: {
              color: '#3498db'
            }
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: [
        {
          name: energyLabel,
          type: energyChartType,
          yAxisIndex: 0,
          data: energyValues,
          smooth: energyChartType === 'line',
          lineStyle: energyChartType === 'line' ? {
            color: '#c2410c',
            width: 2
          } : undefined,
          itemStyle: {
            color: '#c2410c'
          },
          symbol: energyChartType === 'line' ? 'circle' : undefined,
          symbolSize: energyChartType === 'line' ? 6 : undefined,
          barMaxWidth: 40,
          // Add area shading for line charts
          areaStyle: energyChartType === 'line' ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#c2410c40' },
              { offset: 1, color: '#c2410c10' }
            ])
          } : undefined
        },
        {
          name: 'OAT',
          type: 'line', // Always line for temperature
          yAxisIndex: 1,
          data: tempValues,
          smooth: true,
          lineStyle: {
            color: '#3498db',
            width: 2
          },
          itemStyle: {
            color: '#3498db'
          },
          symbol: 'circle',
          symbolSize: 6
        }
      ],
      dataZoom: sortedTimestamps.length > 50 ? [
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

    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [energyData, temperatureData, period, date, aggregation, loading]);

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

  return <div ref={chartRef} style={{ width: '100%', height: '500px' }} />;
}

export default function SiteDataPage() {
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [aggregation, setAggregation] = useState<'hourly' | 'daily' | 'monthly'>('hourly');

  // Calculate time range and interval
  const getTimeRangeAndInterval = () => {
    let startDate: Date;
    let endDate: Date;
    let interval: string;

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
      interval = aggregation === 'hourly' ? '1h' : '1d';
    } else if (period === 'month') {
      const [year, month] = formattedDate.split('-').map(Number);
      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
      interval = aggregation === 'hourly' ? '1h' : aggregation === 'daily' ? '1d' : '1d';
    } else {
      const year = parseInt(formattedDate);
      startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
      interval = aggregation === 'hourly' ? '1h' : aggregation === 'daily' ? '1d' : '1M';
    }

    return { startDate, endDate, interval };
  };

  const { startDate, endDate, interval } = getTimeRangeAndInterval();
  const startTime = startDate.toISOString();
  const stopTime = endDate.toISOString();

  const { data, loading, error } = useSiteEnergyData(startTime, interval, 10000, stopTime);
  
  // Fetch OAT data
  const oatDeviceId = siteConfig.oatSensorDeviceId;
  const { data: oatData, loading: oatLoading } = useHistoricalData(
    'temperature',
    startTime,
    interval,
    oatDeviceId,
    stopTime
  );

  // Update date format when period changes
  const handlePeriodChange = (newPeriod: 'day' | 'month' | 'year') => {
    setPeriod(newPeriod);
    
    const today = new Date();
    if (newPeriod === 'day') {
      setDate(today.toISOString().split('T')[0]);
      setAggregation('hourly');
    } else if (newPeriod === 'month') {
      setDate(today.toISOString().slice(0, 7));
      if (aggregation === 'monthly') {
        setAggregation('daily');
      }
    } else {
      setDate(today.getFullYear().toString());
    }
  };

  // Merge gas + oil series
  const mergeSeries = (
    gas: { timestamp: string; value: number }[],
    oil: { timestamp: string; value: number }[]
  ) => {
    const map = new Map<string, number>();
    gas.forEach(pt => map.set(pt.timestamp, (map.get(pt.timestamp) || 0) + (pt.value || 0)));
    oil.forEach(pt => map.set(pt.timestamp, (map.get(pt.timestamp) || 0) + (pt.value || 0)));
    const merged = Array.from(map.entries()).map(([timestamp, value]) => ({ timestamp, value }));
    merged.sort((x, y) => new Date(x.timestamp).getTime() - new Date(y.timestamp).getTime());
    return merged;
  };

  const fossilSeries = mergeSeries(data.timeSeries?.gas || [], data.timeSeries?.oil || []);
  const fossilTotal = (data.totalGas || 0) + (data.totalOil || 0);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-gray-600 text-lg">Error loading site data</p>
          <p className="text-gray-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Site-Wide Energy Data</h1>
              <p className="text-gray-600">Overview of total electricity, gas and oil consumption across Cokethorpe</p>
            </div>
          </div>
          <DateRangePicker 
            period={period}
            date={date}
            aggregation={aggregation}
            onPeriodChange={handlePeriodChange}
            onDateChange={setDate}
            onAggregationChange={setAggregation}
          />
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SiteMetricCard
            title="Total Electricity"
            value={data.totalElectricity}
            unit="kWh"
            color="#3498db"
            icon="⚡"
            period={period}
            date={date}
          />
          <SiteMetricCard
            title="Total Gas"
            value={data.totalGas}
            unit="kWh"
            color="#e67e22"
            icon="🔥"
            period={period}
            date={date}
          />
          <SiteMetricCard
            title="Total Oil"
            value={data.totalOil}
            unit="kWh"
            color="#8b5e3c"
            icon="🛢️"
            period={period}
            date={date}
          />
        </div>

        {/* Time series chart with OAT */}
        <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
          <SiteTimeSeriesChart
            energyData={fossilSeries}
            temperatureData={oatData}
            period={period}
            date={date}
            aggregation={aggregation}
            loading={loading || oatLoading}
          />
        </div>

        {/* Summary Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg p-6 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">Total Energy</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {(data.totalElectricity !== null || data.totalGas !== null || data.totalOil !== null)
                  ? ((data.totalElectricity || 0) + (data.totalGas || 0) + (data.totalOil || 0)).toLocaleString('en-US', { maximumFractionDigits: 0 })
                  : '--'}
                <span className="text-lg ml-1">kWh</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">Active Buildings</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data.buildingBreakdown.filter(b => (b.gasUsage !== null) || (b.oilUsage !== null)).length}
                <span className="text-lg ml-1">/ {data.buildingBreakdown.length}</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">Energy Split</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data.totalElectricity !== null && fossilTotal > 0
                  ? `${((data.totalElectricity / (data.totalElectricity + fossilTotal)) * 100).toFixed(0)}% / ${((fossilTotal / (data.totalElectricity + fossilTotal)) * 100).toFixed(0)}%`
                  : '--'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Elec / Fossil (Gas+Oil)</p>
            </div>
          </div>
        </div>

        {/* Building Comparison Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <BuildingComparisonChart 
            data={data.buildingBreakdown} 
            period={period}
            date={date}
          />
        </div>

        {/* Building List Table */}
        <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Building Gas & Oil Usage Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Building
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gas Usage (kWh)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oil Usage (kWh)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % of Fossil
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.buildingBreakdown.map((building, index) => {
                  const combined = (building.gasUsage || 0) + (building.oilUsage || 0);
                  return (
                    <tr key={building.buildingId} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {building.buildingName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                        {building.gasUsage !== null 
                          ? (building.gasUsage ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                        {building.oilUsage !== null 
                          ? (building.oilUsage ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {combined > 0 && fossilTotal > 0
                          ? `${((combined / fossilTotal) * 100).toFixed(1)}%`
                          : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}