'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SensorType } from '@/types/sensor';
import { buildings, getPrimarySensorDevice } from '@/lib/buildings';
import { useSensorData } from '@/hooks/useSensorData';
import { useEnergyData } from '@/hooks/useEnergyData';
import { getColorForMetric, getUnitForMetric } from '@/lib/utils';

function BuildingMarker({ 
  building, 
  selectedMetric 
}: { 
  building: typeof buildings[0], 
  selectedMetric: SensorType 
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Get all sensor device IDs
  const tempDeviceId = getPrimarySensorDevice(building.id, 'temperature');
  const humidityDeviceId = getPrimarySensorDevice(building.id, 'humidity');
  const batteryDeviceId = getPrimarySensorDevice(building.id, 'battery');
  const energyDeviceId = getPrimarySensorDevice(building.id, 'energy');

  // Fetch all metrics
  const { value: temperature } = useSensorData('temperature', 5000, tempDeviceId);
  const { value: humidity } = useSensorData('humidity', 5000, humidityDeviceId);
  const { value: battery } = useSensorData('battery', 5000, batteryDeviceId);
  const { value: energyNormalized } = useEnergyData(building.id, energyDeviceId, 5000, 'normalized');
  const { value: energyRate } = useEnergyData(building.id, energyDeviceId, 5000, 'power');

  // Get the value to display based on selected metric
  let displayValue: number | null = null;
  if (selectedMetric === 'temperature') displayValue = temperature;
  else if (selectedMetric === 'humidity') displayValue = humidity;
  else if (selectedMetric === 'energy') displayValue = energyNormalized;
  else if (selectedMetric === 'battery') displayValue = battery;

  const backgroundColor = displayValue !== null 
    ? getColorForMetric(displayValue, selectedMetric) 
    : '#95a5a6';
  
  // Get appropriate unit based on metric
  let unit = getUnitForMetric(selectedMetric);
  if (selectedMetric === 'energy') {
    unit = 'kWh/m²';
  }

  return (
    <Link 
      href={`/buildings/${building.id}`}
      className="building-marker-container"
      style={{
        top: building.coordinates.top, 
        left: building.coordinates.left,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div 
        className="temp-sensor" 
        style={{
          backgroundColor: backgroundColor,
        }}
      >
        <div className="temp-value">
          {displayValue !== null ? (
            selectedMetric === 'energy' ? displayValue.toFixed(0) : displayValue.toFixed(1)
          ) : '--'}
        </div>
        <div className="temp-unit">{unit}</div>
      </div>

      {/* Hover Tooltip */}
      {showTooltip && (
        <div className="building-tooltip">
          <div className="tooltip-header">{building.name}</div>
          <div className="tooltip-divider"></div>
          <div className="tooltip-content">
            {tempDeviceId && temperature !== null && (
              <div className="tooltip-row">
                <span className="tooltip-label">Temperature:</span>
                <span className="tooltip-value">{temperature.toFixed(1)}°C</span>
              </div>
            )}
            {humidityDeviceId && humidity !== null && (
              <div className="tooltip-row">
                <span className="tooltip-label">Humidity:</span>
                <span className="tooltip-value">{humidity.toFixed(1)}%</span>
              </div>
            )}
            {energyDeviceId && energyNormalized !== null && (
              <div className="tooltip-row">
                <span className="tooltip-label">Energy (norm):</span>
                <span className="tooltip-value">{energyNormalized.toFixed(0)} kWh/m²</span>
              </div>
            )}
            {energyDeviceId && energyRate !== null && (
              <div className="tooltip-row">
                <span className="tooltip-label">Energy (rate):</span>
                <span className="tooltip-value">{energyRate.toFixed(0)} kWh</span>
              </div>
            )}
            {batteryDeviceId && battery !== null && (
              <div className="tooltip-row">
                <span className="tooltip-label">Battery:</span>
                <span className="tooltip-value">{battery.toFixed(0)}%</span>
              </div>
            )}
            <div className="tooltip-footer">
              <span className="tooltip-area">Area: {building.area.toLocaleString()}m²</span>
            </div>
          </div>
          <div className="tooltip-click-hint">
            Click to view details →
          </div>
        </div>
      )}
    </Link>
  );
}

export default function Home() {
  const [selectedMetric, setSelectedMetric] = useState<SensorType>('temperature');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <>
      <style jsx global>{`
        body {
          font-family: var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
          background: #1a1a1a;
          color: #fff;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        
        main {
          height: calc(100vh - 64px);
          overflow: hidden;
          position: relative;
          opacity: ${isLoaded ? 1 : 0};
          transition: opacity 0.3s ease-in;
        }
        
        #container-view {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        #container-view img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .building-marker-container {
          position: absolute;
          transform: translate(-50%, -50%);
          z-index: 10;
          text-decoration: none;
          color: inherit;
        }

        .building-marker-container:hover {
          z-index: 9999;
        }
        
        .temp-sensor {
          width: 3.5vw;
          height: 3.5vw;
          min-width: 60px;
          max-width: 90px;
          min-height: 60px;
          max-height: 90px;
          border-radius: 50%;
          font-weight: bold;
          color: white;
          text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
          box-shadow: 0 4px 15px rgba(255,255,255,0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(3px);
          transition: all 0.3s ease;
          border: 3px solid rgba(255,255,255,0.6);
          aspect-ratio: 1;
          cursor: pointer;
          padding: 8px;
        }
        
        .building-marker-container:hover .temp-sensor {
          transform: scale(1.15);
          box-shadow: 0 6px 25px rgba(255,255,255,0.7);
          border-width: 4px;
          z-index: 20;
        }
        
        .temp-value {
          font-size: 1.1vw;
          min-font-size: 16px;
          font-weight: bold;
          text-align: center;
          line-height: 1.1;
          margin-bottom: 2px;
        }

        .temp-unit {
          font-size: 0.6vw;
          min-font-size: 10px;
          opacity: 0.95;
          font-weight: 600;
          text-align: center;
          line-height: 1;
        }

        /* Tooltip Styles */
        .building-tooltip {
          position: absolute;
          top: 50%;
          left: calc(100% + 15px);
          transform: translateY(-50%);
          background: rgba(30, 41, 59, 0.98);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 0;
          min-width: 220px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          z-index: 10000;
          animation: tooltipFadeIn 0.2s ease-out;
          backdrop-filter: blur(10px);
          pointer-events: none;
        }

        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }

        .tooltip-header {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          padding: 12px 16px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px 10px 0 0;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tooltip-divider {
          height: 1px;
          background: linear-gradient(
            to right,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          margin: 0;
        }

        .tooltip-content {
          padding: 12px 16px;
        }

        .tooltip-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .tooltip-row:last-of-type {
          border-bottom: none;
        }

        .tooltip-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .tooltip-value {
          font-size: 14px;
          color: #fff;
          font-weight: 600;
          text-align: right;
        }

        .tooltip-footer {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tooltip-area {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
        }

        .tooltip-click-hint {
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(59, 130, 246, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          font-size: 12px;
          color: rgba(96, 165, 250, 1);
          font-weight: 600;
          border-radius: 0 0 10px 10px;
        }

        /* Arrow pointer for tooltip */
        .building-tooltip::before {
          content: '';
          position: absolute;
          top: 50%;
          left: -10px;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 8px 10px 8px 0;
          border-color: transparent rgba(255, 255, 255, 0.3) transparent transparent;
        }

        .building-tooltip::after {
          content: '';
          position: absolute;
          top: 50%;
          left: -7px;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 7px 9px 7px 0;
          border-color: transparent rgba(30, 41, 59, 0.98) transparent transparent;
        }
        
        #legend-container {
          position: fixed;
          top: 84px;
          right: 20px;
          background: rgba(44, 62, 80, 0.95);
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.5);
          z-index: 100;
        }
        
        #legend-container h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          font-weight: 600;
          opacity: 0.8;
        }
        
        .legend-option {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          cursor: pointer;
        }
        
        .legend-option:last-child {
          margin-bottom: 0;
        }
        
        .legend-option input[type="radio"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        
        .legend-option label {
          font-size: 14px;
          cursor: pointer;
          user-select: none;
        }

        @media (max-width: 768px) {
          .temp-sensor {
            width: 60px;
            height: 60px;
            min-width: 55px;
            max-width: 65px;
            min-height: 55px;
            max-height: 65px;
            padding: 6px;
          }
          
          .temp-value {
            font-size: 16px;
          }
          
          .temp-unit {
            font-size: 10px;
          }

          .building-tooltip {
            min-width: 200px;
            font-size: 12px;
          }

          .tooltip-header {
            font-size: 14px;
            padding: 10px 12px;
          }
        }
      `}</style>

      <div id="legend-container">
        <h3>Display</h3>
        <div className="legend-option">
          <input 
            type="radio" 
            id="temp-radio" 
            name="metric" 
            value="temperature"
            checked={selectedMetric === 'temperature'}
            onChange={(e) => setSelectedMetric(e.target.value as SensorType)}
          />
          <label htmlFor="temp-radio">Temperature</label>
        </div>
        <div className="legend-option">
          <input 
            type="radio" 
            id="humidity-radio" 
            name="metric" 
            value="humidity"
            checked={selectedMetric === 'humidity'}
            onChange={(e) => setSelectedMetric(e.target.value as SensorType)}
          />
          <label htmlFor="humidity-radio">Humidity</label>
        </div>
        <div className="legend-option">
          <input 
            type="radio" 
            id="energy-radio" 
            name="metric" 
            value="energy"
            checked={selectedMetric === 'energy'}
            onChange={(e) => setSelectedMetric(e.target.value as SensorType)}
          />
          <label htmlFor="energy-radio">Energy (kWh/m²)</label>
        </div>
      </div>

      <div id="container-view">
        <img src="/3d_map.jpg" alt="Site Plan" />
        
        {buildings.map((building) => (
          <BuildingMarker
            key={building.id}
            building={building}
            selectedMetric={selectedMetric}
          />
        ))}
      </div>
    </>
  );
}