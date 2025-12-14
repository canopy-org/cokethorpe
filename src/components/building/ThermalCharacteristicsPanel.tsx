'use client';

import { useState } from 'react';
import { useThermalCharacteristics } from '@/hooks/useThermalCharacteristics';

interface ThermalCharacteristicsPanelProps {
  buildingId: string;
}

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
}

export default function ThermalCharacteristicsPanel({ buildingId }: ThermalCharacteristicsPanelProps) {
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [designSetpoint, setDesignSetpoint] = useState(20);
  const [designOAT, setDesignOAT] = useState(-3);
  
  const { data, loading, error } = useThermalCharacteristics({
    buildingId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Thermal Characteristics</h3>
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
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Peak Heat Loss - Primary Display */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Setpoint:</label>
                <input
                  type="number"
                  value={designSetpoint}
                  onChange={(e) => setDesignSetpoint(parseFloat(e.target.value) || 20)}
                  step="0.5"
                  min="15"
                  max="25"
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
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
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-sm text-gray-500">°C</span>
              </div>
              <span className="text-sm text-gray-400">ΔT = {designDeltaT}K</span>
            </div>

            <div className="flex items-baseline gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Estimated Peak Heat Loss</p>
                <p className="text-4xl font-bold text-purple-600">
                  {peakHeatLoss !== null ? peakHeatLoss.toFixed(1) : '--'}
                  <span className="text-xl font-normal text-gray-500 ml-1">kW</span>
                </p>
              </div>
              <div className="text-2xl text-gray-300">|</div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Normalised</p>
                <p className="text-2xl font-semibold text-purple-500">
                  {peakHeatLossPerArea !== null ? peakHeatLossPerArea.toFixed(0) : '--'}
                  <span className="text-sm font-normal text-gray-500 ml-1">W/m²</span>
                </p>
              </div>
            </div>
          </div>

          {/* Supporting Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Heat Loss Coefficient</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {chars.hlc !== null ? chars.hlc.toFixed(2) : '--'}
                <span className="text-sm font-normal text-gray-500 ml-1">kW/K</span>
              </p>
              {chars.hlcPerArea !== null && (
                <p className="text-sm text-gray-500">{chars.hlcPerArea.toFixed(2)} W/m²K</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time Constant (τ)</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {chars.tau !== null ? chars.tau.toFixed(1) : '--'}
                <span className="text-sm font-normal text-gray-500 ml-1">hours</span>
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Thermal Mass</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {chars.thermalMass !== null ? chars.thermalMass.toFixed(1) : '--'}
                <span className="text-sm font-normal text-gray-500 ml-1">kWh/K</span>
              </p>
              {chars.thermalMassPerArea !== null && (
                <p className="text-sm text-gray-500">{chars.thermalMassPerArea.toFixed(0)} Wh/m²K</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}