'use client';

import { useState } from 'react';
import { useThermalCharacteristics } from '@/hooks/useThermalCharacteristics';

interface ThermalCharacteristicsPanelProps {
  buildingId: string;
}

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30); // Default to last 30 days
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
}

function getTauInterpretation(tau: number): { label: string; description: string; color: string } {
  if (tau < 8) {
    return {
      label: 'Lightweight',
      description: 'Fast response, quick to heat but loses heat rapidly. Typical of timber frame or poorly insulated buildings.',
      color: '#f44336'
    };
  } else if (tau < 20) {
    return {
      label: 'Medium Weight',
      description: 'Balanced thermal response. Typical of standard brick/block construction.',
      color: '#ff9800'
    };
  } else if (tau < 40) {
    return {
      label: 'Heavyweight',
      description: 'Slow response, retains heat well. Typical of solid masonry or well-insulated buildings.',
      color: '#4caf50'
    };
  } else {
    return {
      label: 'Very Heavy',
      description: 'Very slow thermal response. May indicate high thermal mass or complex heating systems.',
      color: '#2196f3'
    };
  }
}

function getHLCInterpretation(hlcPerArea: number): { label: string; description: string; color: string } {
  if (hlcPerArea < 0.5) {
    return {
      label: 'Excellent',
      description: 'Very low heat loss. Passivhaus or highly insulated building.',
      color: '#4caf50'
    };
  } else if (hlcPerArea < 1.5) {
    return {
      label: 'Good',
      description: 'Low heat loss. Well-insulated modern building.',
      color: '#8bc34a'
    };
  } else if (hlcPerArea < 3) {
    return {
      label: 'Average',
      description: 'Typical heat loss for older buildings. Improvement potential exists.',
      color: '#ff9800'
    };
  } else if (hlcPerArea < 5) {
    return {
      label: 'Poor',
      description: 'High heat loss. Consider insulation upgrades.',
      color: '#ff5722'
    };
  } else {
    return {
      label: 'Very Poor',
      description: 'Very high heat loss. Significant improvement needed.',
      color: '#f44336'
    };
  }
}

export default function ThermalCharacteristicsPanel({ buildingId }: ThermalCharacteristicsPanelProps) {
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [designSetpoint, setDesignSetpoint] = useState(20); // Indoor setpoint °C
  const [designOAT, setDesignOAT] = useState(-3); // Design outdoor temperature °C
  
  const { data, loading, error } = useThermalCharacteristics({
    buildingId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  // Calculate peak heat loss
  const designDeltaT = designSetpoint - designOAT;
  const peakHeatLoss = data?.characteristics?.hlc 
    ? data.characteristics.hlc * designDeltaT 
    : null;
  const peakHeatLossPerArea = data?.characteristics?.hlcPerArea
    ? data.characteristics.hlcPerArea * designDeltaT
    : null;

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Thermal Characteristics</h3>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="text-red-500 text-2xl mb-2">⚠️</div>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const chars = data?.characteristics;
  const tauInfo = chars?.tau ? getTauInterpretation(chars.tau) : null;
  const hlcInfo = chars?.hlcPerArea ? getHLCInterpretation(chars.hlcPerArea) : null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Thermal Characteristics</h3>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Analysing thermal behaviour...</p>
          </div>
        </div>
      ) : !chars || (chars.hlc === null && chars.tau === null) ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="text-5xl mb-3">🌡️</div>
            <p className="text-gray-600 font-medium">Insufficient Data</p>
            <p className="text-gray-500 text-sm mt-1">
              Need more heating/cooling cycles to calculate thermal characteristics.
            </p>
            {data?.message && <p className="text-gray-400 text-xs mt-2">{data.message}</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Heat Loss Coefficient */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Heat Loss Coefficient</p>
                  <p className="text-xs text-gray-400 mt-0.5">Energy required per degree difference</p>
                </div>
                <span className="text-2xl">🔥</span>
              </div>
              {chars.hlc !== null ? (
                <>
                  <p className="text-3xl font-bold text-orange-600">
                    {chars.hlc.toFixed(2)}
                    <span className="text-lg font-normal text-gray-500 ml-1">kW/K</span>
                  </p>
                  <p className="text-lg text-orange-500 mt-1">
                    {chars.hlcPerArea?.toFixed(2)}
                    <span className="text-sm text-gray-500 ml-1">W/m²K</span>
                  </p>
                  {hlcInfo && (
                    <div className="mt-3 pt-3 border-t border-orange-200">
                      <span 
                        className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: hlcInfo.color }}
                      >
                        {hlcInfo.label}
                      </span>
                      <p className="text-xs text-gray-500 mt-2">{hlcInfo.description}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-2xl text-gray-400">--</p>
              )}
            </div>

            {/* Thermal Time Constant */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Thermal Time Constant (τ)</p>
                  <p className="text-xs text-gray-400 mt-0.5">How quickly the building responds</p>
                </div>
                <span className="text-2xl">⏱️</span>
              </div>
              {chars.tau !== null ? (
                <>
                  <p className="text-3xl font-bold text-blue-600">
                    {chars.tau.toFixed(1)}
                    <span className="text-lg font-normal text-gray-500 ml-1">hours</span>
                  </p>
                  <p className="text-sm text-blue-500 mt-1">
                    ~{(chars.tau / 24).toFixed(1)} days to reach 63% of target
                  </p>
                  {tauInfo && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <span 
                        className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: tauInfo.color }}
                      >
                        {tauInfo.label}
                      </span>
                      <p className="text-xs text-gray-500 mt-2">{tauInfo.description}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-2xl text-gray-400">--</p>
              )}
            </div>
          </div>

          {/* Derived Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            {/* Thermal Mass */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Effective Thermal Mass</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {chars.thermalMass !== null ? (
                  <>
                    {chars.thermalMass.toFixed(1)}
                    <span className="text-sm font-normal text-gray-500 ml-1">kWh/K</span>
                  </>
                ) : '--'}
              </p>
              {chars.thermalMassPerArea !== null && (
                <p className="text-sm text-gray-500">
                  {chars.thermalMassPerArea.toFixed(0)} Wh/m²K
                </p>
              )}
            </div>
          </div>

          {/* Peak Heat Loss Calculator */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Estimated Peak Heat Loss</p>
                <p className="text-xs text-gray-500 mt-0.5">Based on design conditions</p>
              </div>
              <span className="text-2xl">❄️</span>
            </div>
            
            {/* Design Condition Inputs */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Indoor Setpoint:</label>
                <input
                  type="number"
                  value={designSetpoint}
                  onChange={(e) => setDesignSetpoint(parseFloat(e.target.value) || 20)}
                  step="0.5"
                  min="15"
                  max="25"
                  className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <span className="text-sm text-gray-500">°C</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Design OAT:</label>
                <input
                  type="number"
                  value={designOAT}
                  onChange={(e) => setDesignOAT(parseFloat(e.target.value) || -3)}
                  step="1"
                  min="-15"
                  max="10"
                  className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <span className="text-sm text-gray-500">°C</span>
              </div>
              <div className="text-sm text-gray-500">
                ΔT = <span className="font-medium text-purple-600">{designDeltaT}K</span>
              </div>
            </div>

            {/* Peak Heat Loss Result */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/60 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Peak Heat Loss</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {peakHeatLoss !== null ? (
                    <>
                      {peakHeatLoss.toFixed(1)}
                      <span className="text-lg font-normal text-gray-500 ml-1">kW</span>
                    </>
                  ) : '--'}
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Peak Heat Loss (Normalised)</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {peakHeatLossPerArea !== null ? (
                    <>
                      {peakHeatLossPerArea.toFixed(0)}
                      <span className="text-lg font-normal text-gray-500 ml-1">W/m²</span>
                    </>
                  ) : '--'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Based on {data?.buildingArea?.toLocaleString()} m² floor area
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}