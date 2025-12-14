'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts';
import { useDegreeHoursData, DegreeHoursDataPoint, RegressionResult } from '@/hooks/useDegreeHoursData';

interface EnergySignatureChartProps {
  buildingId: string;
  height?: number;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3); // Default to last 3 months
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay();
}

function calculateRegression(data: { x: number; y: number }[]): RegressionResult | null {
  if (data.length < 3) return null;
  
  // Filter out any invalid values
  const validData = data.filter(d => 
    isFinite(d.x) && isFinite(d.y) && d.x >= 0 && d.y >= 0
  );
  
  if (validData.length < 3) return null;
  
  const n = validData.length;
  const sumX = validData.reduce((s, d) => s + d.x, 0);
  const sumY = validData.reduce((s, d) => s + d.y, 0);
  const sumXY = validData.reduce((s, d) => s + d.x * d.y, 0);
  const sumX2 = validData.reduce((s, d) => s + d.x * d.x, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0 || !isFinite(denominator)) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Validate results
  if (!isFinite(slope) || !isFinite(intercept)) return null;

  // Calculate R²
  const meanY = sumY / n;
  const ssTotal = validData.reduce((s, d) => s + Math.pow(d.y - meanY, 2), 0);
  const ssResidual = validData.reduce((s, d) => {
    const predicted = slope * d.x + intercept;
    return s + Math.pow(d.y - predicted, 2);
  }, 0);
  const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

  return {
    slope: Math.round(slope * 1000) / 1000,
    intercept: Math.round(intercept * 100) / 100,
    rSquared: Math.round(Math.max(0, Math.min(1, rSquared)) * 1000) / 1000
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
  const [excludedDays, setExcludedDays] = useState<Set<number>>(new Set([0])); // Exclude Sunday by default

  const { data, loading, error } = useDegreeHoursData({
    buildingId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    baseTemp
  });

  // Filter data by excluded days and recalculate regression
  const { filteredData, filteredRegression } = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return { filteredData: [], filteredRegression: null };
    }
    
    const filtered = data.data.filter(point => {
      const dayOfWeek = getDayOfWeek(point.date);
      return !excludedDays.has(dayOfWeek);
    });

    if (filtered.length === 0) {
      return { filteredData: [], filteredRegression: null };
    }

    const area = data.buildingArea || 1;
    const divisor = normalized ? area : 1;
    
    const regression = calculateRegression(
      filtered.map(d => ({ x: d.degreeHours, y: d.energyUsage / divisor }))
    );

    return { filteredData: filtered, filteredRegression: regression };
  }, [data, excludedDays, normalized]);

  const toggleDay = (day: number) => {
    setExcludedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  // Validate and set date range, preventing future dates
  const handleStartDateChange = (newStart: string) => {
    const today = getTodayString();
    const validStart = newStart > today ? today : newStart;
    setDateRange(prev => ({
      ...prev,
      startDate: validStart,
      // Ensure end date is not before start date
      endDate: prev.endDate < validStart ? validStart : prev.endDate
    }));
  };

  const handleEndDateChange = (newEnd: string) => {
    const today = getTodayString();
    const validEnd = newEnd > today ? today : newEnd;
    setDateRange(prev => ({
      ...prev,
      endDate: validEnd,
      // Ensure start date is not after end date
      startDate: prev.startDate > validEnd ? validEnd : prev.startDate
    }));
  };

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

    // Separate included and excluded points
    const includedData = data.data
      .filter(point => !excludedDays.has(getDayOfWeek(point.date)))
      .map(point => ({
        value: [point.degreeHours, point.energyUsage / divisor],
        date: point.date,
        dayName: DAYS_OF_WEEK[getDayOfWeek(point.date)]
      }));

    const excludedData = data.data
      .filter(point => excludedDays.has(getDayOfWeek(point.date)))
      .map(point => ({
        value: [point.degreeHours, point.energyUsage / divisor],
        date: point.date,
        dayName: DAYS_OF_WEEK[getDayOfWeek(point.date)]
      }));

    // Calculate regression line points for the chart (using filtered data)
    let regressionLine: [number, number][] = [];
    if (filteredRegression && filteredData.length >= 2) {
      const xValues = filteredData.map(d => d.degreeHours);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      
      // Only draw line if we have a valid range
      if (isFinite(minX) && isFinite(maxX) && minX !== maxX) {
        regressionLine = [
          [minX, filteredRegression.slope * minX + filteredRegression.intercept],
          [maxX, filteredRegression.slope * maxX + filteredRegression.intercept]
        ];
      }
    }

    const excludedDayNames = Array.from(excludedDays).map(d => DAYS_OF_WEEK[d]).join(', ');

    const option: echarts.EChartsOption = {
      title: {
        text: `Energy Signature: ${data.buildingName}`,
        subtext: `Base temp: ${baseTemp}°C | ${filteredData.length} days included${excludedDays.size > 0 ? ` (excl: ${excludedDayNames})` : ''}`,
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
            <strong>${point.date}</strong> (${point.dayName})<br/>
            Degree Hours: ${point.value[0].toFixed(1)}<br/>
            Energy: ${point.value[1].toFixed(2)} ${yUnit}
          `;
        }
      },
      legend: {
        data: ['Included Days', 'Excluded Days', 'Regression Line'],
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
          name: 'Included Days',
          type: 'scatter',
          data: includedData,
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
          name: 'Excluded Days',
          type: 'scatter',
          data: excludedData,
          symbolSize: 10,
          itemStyle: {
            color: '#ccc',
            borderColor: '#999',
            borderWidth: 1,
            opacity: 0.6
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
  }, [data, loading, baseTemp, normalized, excludedDays, filteredData, filteredRegression]);

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
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Start Date:</label>
          <input
            type="date"
            value={dateRange.startDate}
            max={getTodayString()}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">End Date:</label>
          <input
            type="date"
            value={dateRange.endDate}
            max={getTodayString()}
            onChange={(e) => handleEndDateChange(e.target.value)}
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

      {/* Day of week filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-gray-200">
        <label className="text-sm font-medium text-gray-700">Include days:</label>
        {DAYS_OF_WEEK.map((day, index) => (
          <button
            key={day}
            onClick={() => toggleDay(index)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              excludedDays.has(index)
                ? 'bg-gray-200 text-gray-400 line-through'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            {day}
          </button>
        ))}
        <button
          onClick={() => setExcludedDays(new Set())}
          className="ml-2 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          All
        </button>
        <button
          onClick={() => setExcludedDays(new Set([0, 6]))}
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          Weekdays only
        </button>
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
      {filteredRegression && data && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <RegressionStat
            label="Heat Loss Coefficient"
            value={normalized 
              ? (filteredRegression.slope).toFixed(4)
              : filteredRegression.slope.toFixed(3)
            }
            unit={normalized ? 'kWh/m²/°C·h' : 'kWh/°C·h'}
            description="Energy per degree-hour (slope)"
            color="#e64a19"
          />
          <RegressionStat
            label="Base Load"
            value={normalized 
              ? (filteredRegression.intercept).toFixed(3)
              : filteredRegression.intercept.toFixed(1)
            }
            unit={normalized ? 'kWh/m²/day' : 'kWh/day'}
            description="Non-heating consumption (y-intercept)"
            color="#2196f3"
          />
          <RegressionStat
            label="R² (Fit Quality)"
            value={filteredRegression.rSquared.toFixed(3)}
            unit=""
            description={getR2Description(filteredRegression.rSquared)}
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