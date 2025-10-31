'use client';

import { useSiteEnergyData } from '@/hooks/useSiteEnergyData';
import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { getBuildingById } from '@/lib/buildings';
import TimeSeriesChart from '@/components/charts/TimeSeriesChart';

function TimePeriodSelector({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void 
}) {
  const periods = [
    { label: 'Last Hour', value: '-1h' },
    { label: 'Last 24 Hours', value: '-24h' },
    { label: 'Last 7 Days', value: '-7d' },
    { label: 'Last 30 Days', value: '-30d' },
    { label: 'Last 90 Days', value: '-90d' },
    { label: 'Last 12 Months', value: '-365d' }
  ];

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-700">Time Period:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium"
      >
        {periods.map((period) => (
          <option key={period.value} value={period.value}>
            {period.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SiteMetricCard({ 
  title, 
  value, 
  unit, 
  color, 
  icon,
  timeRange 
}: { 
  title: string; 
  value: number | null; 
  unit: string; 
  color: string;
  icon: string;
  timeRange: string;
}) {
  const getPeriodLabel = (range: string): string => {
    const labels: { [key: string]: string } = {
      '-1h': 'Last Hour',
      '-6h': 'Last 6 Hours',
      '-24h': 'Last 24 Hours',
      '-7d': 'Last 7 Days',
      '-30d': 'Last 30 Days',
      '-90d': 'Last 90 Days',
    };
    return labels[range] || range;
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
      <p className="text-xs text-gray-400 mt-2">{getPeriodLabel(timeRange)}</p>
    </div>
  );
}

type ChartDisplayMode = 'absolute' | 'normalized';

function BuildingComparisonChart({ 
  data,
  timeRange 
}: { 
  data: { buildingId: string; buildingName: string; gasUsage?: number | null; oilUsage?: number | null }[];
  timeRange: string;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [displayMode, setDisplayMode] = useState<ChartDisplayMode>('absolute');

  const getPeriodLabel = (range: string): string => {
    const labels: { [key: string]: string } = {
      '-1h': 'Last Hour',
      '-6h': 'Last 6 Hours',
      '-24h': 'Last 24 Hours',
      '-7d': 'Last 7 Days',
      '-30d': 'Last 30 Days',
      '-90d': 'Last 90 Days',
      '-365d': 'Last 12 Months'
    };
    return labels[range] || range;
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
      ? `Normalized Gas + Oil by Building (${getPeriodLabel(timeRange)})`
      : `Gas + Oil by Building (${getPeriodLabel(timeRange)})`;

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
  }, [data, timeRange, displayMode]);

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

export default function SiteDataPage() {
  const [timeRange, setTimeRange] = useState('-24h');
  const { data, loading, error } = useSiteEnergyData(timeRange, 10000);

  // Build total timeseries for gas or oil by attempting:
  // 1) data.timeSeries[type] (common server-side shape)
  // 2) sum per-building series when each building exposes a series array
  // 3) fallback to a single-point series using data.totalGas / data.totalOil
  const buildTotalSeries = (type: 'gas' | 'oil') => {
    // try top-level timeSeries.<type>
    const tsRoot = (data as any)?.timeSeries;
    if (tsRoot && Array.isArray(tsRoot[type])) {
      return (tsRoot[type] as any[]).map(p => ({ timestamp: p.timestamp, value: p.value ?? 0 }));
    }

    // attempt to locate per-building series arrays that match the type
    const perBuildingSeries: { timestamp: string; value: number }[][] = [];

    if (Array.isArray(data.buildingBreakdown)) {
      data.buildingBreakdown.forEach((b: any) => {
        // inspect keys for an array of {timestamp, value}
        for (const key of Object.keys(b || {})) {
          const val = b[key];
          if (!Array.isArray(val) || val.length === 0) continue;
          const first = val[0];
          if (!first || typeof first.timestamp !== 'string') continue;
          // check if items look like time series points
          if (typeof first.value === 'number') {
            // prefer keys that include the type name (e.g., "gas", "oil")
            if (key.toLowerCase().includes(type)) {
              perBuildingSeries.push(val.map((p: any) => ({ timestamp: p.timestamp, value: p.value ?? 0 })));
              break;
            }
            // if no explicit key-match, still accept as a candidate (only if no explicit found)
            perBuildingSeries.push(val.map((p: any) => ({ timestamp: p.timestamp, value: p.value ?? 0 })));
            break;
          }
        }
      });
    }

    if (perBuildingSeries.length > 0) {
      const map = new Map<string, number>();
      perBuildingSeries.forEach(series => {
        series.forEach(pt => {
          map.set(pt.timestamp, (map.get(pt.timestamp) || 0) + (pt.value || 0));
        });
      });
      const arr = Array.from(map.entries()).map(([timestamp, value]) => ({ timestamp, value }));
      arr.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return arr;
    }

    // fallback: single-point series using the aggregate totals
    const total = type === 'gas' ? (data.totalGas || 0) : (data.totalOil || 0);
    return [{ timestamp: new Date().toISOString(), value: total }];
  };

  const gasSeries = buildTotalSeries('gas');
  const oilSeries = buildTotalSeries('oil');

  // Merge gas + oil into a single "fossil" series summing values by timestamp
  const mergeSeries = (a: { timestamp: string; value: number }[], b: { timestamp: string; value: number }[]) => {
    const map = new Map<string, number>();
    a.forEach(pt => map.set(pt.timestamp, (map.get(pt.timestamp) || 0) + (pt.value || 0)));
    b.forEach(pt => map.set(pt.timestamp, (map.get(pt.timestamp) || 0) + (pt.value || 0)));
    const merged = Array.from(map.entries()).map(([timestamp, value]) => ({ timestamp, value }));
    merged.sort((x, y) => new Date(x.timestamp).getTime() - new Date(y.timestamp).getTime());
    return merged;
  };

  const fossilSeries = mergeSeries(gasSeries, oilSeries);

  if (loading && !data.totalGas && !data.totalElectricity && !data.totalOil) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading site data...</p>
        </div>
      </div>
    );
  }

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

  const fossilTotal = (data.totalGas || 0) + (data.totalOil || 0);

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full px-4 py-8">
        {/* Header with Time Selector */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Site-Wide Energy Data</h1>
              <p className="text-gray-600">Overview of total electricity, gas and oil consumption across Cokethorpe</p>
            </div>
            <TimePeriodSelector value={timeRange} onChange={setTimeRange} />
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SiteMetricCard
            title="Total Electricity"
            value={data.totalElectricity}
            unit="kWh"
            color="#3498db"
            icon="⚡"
            timeRange={timeRange}
          />
          <SiteMetricCard
            title="Total Gas"
            value={data.totalGas}
            unit="kWh"
            color="#e67e22"
            icon="🔥"
            timeRange={timeRange}
          />
          <SiteMetricCard
            title="Total Oil"
            value={data.totalOil}
            unit="kWh"
            color="#8b5e3c"
            icon="🛢️"
            timeRange={timeRange}
          />
        </div>

        {/* Time series charts for total Gas and total Oil (summed across devices) */}
        <div className="mb-8 w-full">
          <TimeSeriesChart
            data={fossilSeries}
            title="Total Fossil Fuel — All Devices (Gas + Oil)"
            unit=" kWh"
            color="#c2410c"
            loading={loading}
            height={420}
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
          <BuildingComparisonChart data={data.buildingBreakdown} timeRange={timeRange} />
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