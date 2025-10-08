'use client';

import { useSiteEnergyData } from '@/hooks/useSiteEnergyData';
import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

function TimePeriodSelector({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void 
}) {
  const periods = [
    { label: 'Last Hour', value: '-1h' },
    { label: 'Last 6 Hours', value: '-6h' },
    { label: 'Last 24 Hours', value: '-24h' },
    { label: 'Last 7 Days', value: '-7d' },
    { label: 'Last 30 Days', value: '-30d' },
    { label: 'Last 12 months', value: '-365d' },
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
        {value !== null ? value.toFixed(0) : '--'}
        <span className="text-2xl ml-2">{unit}</span>
      </p>
      <p className="text-xs text-gray-400 mt-2">{getPeriodLabel(timeRange)}</p>
    </div>
  );
}

function BuildingComparisonChart({ 
  data,
  timeRange 
}: { 
  data: { buildingId: string; buildingName: string; gasUsage: number | null }[];
  timeRange: string;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

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

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Filter out null values and prepare data
    const validData = data.filter(d => d.gasUsage !== null);
    const buildingNames = validData.map(d => d.buildingName);
    const gasValues = validData.map(d => d.gasUsage || 0);

    // Chart configuration
    const option: echarts.EChartsOption = {
      title: {
        text: `Gas Usage by Building (${getPeriodLabel(timeRange)})`,
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
          return `${param.name}<br/>Gas Usage: ${param.value.toFixed(2)} kWh`;
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
        name: 'Gas Usage (kWh)',
        nameLocation: 'middle',
        nameGap: 40,
        axisLabel: {
          formatter: '{value}'
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
          name: 'Gas Usage',
          type: 'bar',
          data: gasValues,
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
            formatter: '{c} kWh',
            fontSize: 11
          },
          barMaxWidth: 40
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
  }, [data, timeRange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  if (data.length === 0 || data.every(d => d.gasUsage === null)) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-400">No gas usage data available</p>
      </div>
    );
  }

  return <div ref={chartRef} style={{ width: '100%', height: '600px' }} />;
}

export default function SiteDataPage() {
  const [timeRange, setTimeRange] = useState('-24h');
  const { data, loading, error } = useSiteEnergyData(timeRange, 10000);

  if (loading && !data.totalGas && !data.totalElectricity) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Time Selector */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Site-Wide Energy Data</h1>
              <p className="text-gray-600">Overview of total electricity and gas consumption across Cokethorpe</p>
            </div>
            <TimePeriodSelector value={timeRange} onChange={setTimeRange} />
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
        </div>

        {/* Summary Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg p-6 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">Total Energy</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data.totalElectricity !== null && data.totalGas !== null
                  ? (data.totalElectricity + data.totalGas).toFixed(0)
                  : '--'}
                <span className="text-lg ml-1">kWh</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">Active Buildings</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data.buildingBreakdown.filter(b => b.gasUsage !== null).length}
                <span className="text-lg ml-1">/ {data.buildingBreakdown.length}</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">Energy Split</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data.totalElectricity !== null && data.totalGas !== null && (data.totalElectricity + data.totalGas) > 0
                  ? `${((data.totalElectricity / (data.totalElectricity + data.totalGas)) * 100).toFixed(0)}% / ${((data.totalGas / (data.totalElectricity + data.totalGas)) * 100).toFixed(0)}%`
                  : '--'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Elec / Gas</p>
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
            <h2 className="text-xl font-bold text-gray-900">Building Gas Usage Details</h2>
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
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.buildingBreakdown.map((building, index) => (
                  <tr key={building.buildingId} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {building.buildingName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                      {building.gasUsage !== null ? building.gasUsage.toFixed(2) : '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {building.gasUsage !== null && data.totalGas !== null && data.totalGas > 0
                        ? `${((building.gasUsage / data.totalGas) * 100).toFixed(1)}%`
                        : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}