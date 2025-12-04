'use client';

import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useDegreeHoursData, DegreeHoursDataPoint, RegressionResult } from '@/hooks/useDegreeHoursData';

interface EnergySignatureChartProps {
  buildingId: string;
  height?: number;
}

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3); // Default to last 3 months
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
}

export default function EnergySignatureChart({ 
  buildingId,
  height = 500 
}: EnergySignatureChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [baseTemp, setBaseTemp] = useState(15.5);
  const [normalized, setNormalized] = useState(false);

  const { data, loading, error } = useDegreeHoursData({
    buildingId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    baseTemp
  });

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart only once
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (loading || !data || data.data.length === 0) {
      chartInstance.current.clear();
      return;
    }

    const area = data.buildingArea || 1;
    const divisor = normalized ? area : 1;
    const yUnit = normalized ? 'kWh/m²' : 'kWh';

    // Prepare scatter data
    const scatterData = data.data.map(point => ({
      value: [point.degreeHours, point.energyUsage / divisor],
      date: point.date
    }));

    // Calculate regression line points for the chart
    let regressionLine: [number, number][] = [];
    if (data.regression) {
      const xValues = data.data.map(d => d.degreeHours);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      
      const adjustedSlope = data.regression.slope / divisor;
      const adjustedIntercept = data.regression.intercept / divisor;
      
      regressionLine = [
        [minX, adjustedSlope * minX + adjustedIntercept],
        [maxX, adjustedSlope * maxX + adjustedIntercept]
      ];
    }

    const option: echarts.EChartsOption = {
      title: {
        text: `Energy Signature: ${data.buildingName}`,
        subtext: `Base temp: ${baseTemp}°C | ${data.metadata.daysWithData} days of data`,
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.seriesName === 'Regression') return '';
          const point = params.data;
          return `
            <strong>${point.date}</strong><br/>
            Degree Hours: ${point.value[0].toFixed(1)}<br/>
            Energy: ${point.value[1].toFixed(2)} ${yUnit}
          `;
        }
      },
      legend: {
        data: ['Daily Usage', 'Regression Line'],
        bottom: 10
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '15%'
      },
      xAxis: {
        type: 'value',
        name: 'Degree Hours (°C·h)',
        nameLocation: 'middle',
        nameGap: 35,
        axisLabel: {
          formatter: (value: number) => value.toFixed(0)
        }
      },
      yAxis: {
        type: 'value',
        name: `Energy (${yUnit})`,
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          formatter: (value: number) => value.toLocaleString('en-US', {
            maximumFractionDigits: normalized ? 2 : 0
          })
        }
      },
      series: [
        {
          name: 'Daily Usage',
          type: 'scatter',
          data: scatterData,
          symbolSize: 12,
          itemStyle: {
            color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
              { offset: 0, color: '#ff7043' },
              { offset: 1, color: '#e64a19' }
            ]),
            shadowBlur: 10,
            shadowColor: 'rgba(230, 74, 25, 0.3)'
          }
        },
        {
          name: 'Regression Line',
          type: 'line',
          data: regressionLine,
          lineStyle: {
            color: '#2196f3',
            width: 3,
            type: 'dashed'
          },
          symbol: 'none',
          tooltip: { show: false }
        }
      ]
    };

    chartInstance.current.setOption(option, true);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data, loading, baseTemp, normalized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-2">⚠️</div>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Start Date:</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">End Date:</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Base Temp (°C):</label>
          <input
            type="number"
            value={baseTemp}
            onChange={(e) => setBaseTemp(parseFloat(e.target.value) || 15.5)}
            step="0.5"
            min="10"
            max="20"
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Normalize:</label>
          <button
            onClick={() => setNormalized(!normalized)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              normalized 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {normalized ? 'kWh/m²' : 'kWh'}
          </button>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading energy signature data...</p>
          </div>
        </div>
      ) : data && data.data.length === 0 ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-600 font-semibold">No Data Available</p>
            <p className="text-gray-500 text-sm mt-2">
              No days with both OAT and energy data found for this period.
            </p>
          </div>
        </div>
      ) : (
        <div ref={chartRef} style={{ width: '100%', height }} />
      )}

      {/* Regression Stats */}
      {data?.regression && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <RegressionStat
            label="Heat Loss Coefficient"
            value={normalized 
              ? (data.regression.slope / data.buildingArea).toFixed(4)
              : data.regression.slope.toFixed(3)
            }
            unit={normalized ? 'kWh/m²/°C·h' : 'kWh/°C·h'}
            description="Energy per degree-hour (slope)"
            color="#e64a19"
          />
          <RegressionStat
            label="Base Load"
            value={normalized 
              ? (data.regression.intercept / data.buildingArea).toFixed(3)
              : data.regression.intercept.toFixed(1)
            }
            unit={normalized ? 'kWh/m²/day' : 'kWh/day'}
            description="Non-heating consumption (y-intercept)"
            color="#2196f3"
          />
          <RegressionStat
            label="R² (Fit Quality)"
            value={data.regression.rSquared.toFixed(3)}
            unit=""
            description={getR2Description(data.regression.rSquared)}
            color="#4caf50"
          />
        </div>
      )}
    </div>
  );
}

function RegressionStat({ 
  label, 
  value, 
  unit, 
  description,
  color 
}: { 
  label: string; 
  value: string; 
  unit: string;
  description: string;
  color: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border-l-4" style={{ borderLeftColor: color }}>
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>
        {value}
        {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  );
}

function getR2Description(r2: number): string {
  if (r2 >= 0.9) return 'Excellent fit - very predictable';
  if (r2 >= 0.7) return 'Good fit - reasonably predictable';
  if (r2 >= 0.5) return 'Moderate fit - some variability';
  if (r2 >= 0.3) return 'Weak fit - high variability';
  return 'Poor fit - other factors dominate';
}