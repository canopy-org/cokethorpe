'use client';

import { useState } from 'react';
import { SensorType } from '@/types/sensor';
import { useSensorData } from '@/hooks/useSensorData';
import { getColorForMetric, getUnitForMetric } from '@/lib/utils';

export default function Home() {
  const [selectedMetric, setSelectedMetric] = useState<SensorType>('temperature');
  const { value, lastUpdate, error } = useSensorData(selectedMetric);

  // Random positions for 15 buildings (scattered across the page)
  const buildingPositions = [
    { top: '15%', left: '20%' },
    { top: '25%', left: '45%' },
    { top: '18%', left: '70%' },
    { top: '35%', left: '15%' },
    { top: '40%', left: '55%' },
    { top: '38%', left: '80%' },
    { top: '55%', left: '25%' },
    { top: '52%', left: '50%' },
    { top: '58%', left: '75%' },
    { top: '70%', left: '18%' },
    { top: '68%', left: '42%' },
    { top: '72%', left: '68%' },
    { top: '82%', left: '30%' },
    { top: '85%', left: '60%' },
    { top: '80%', left: '85%' }
  ];

  const backgroundColor = value !== null ? getColorForMetric(value, selectedMetric) : '#95a5a6';
  const unit = getUnitForMetric(selectedMetric);

  return (
    <>
      <style jsx global>{`
        body {
          font-family: Arial, sans-serif;
          background: #1a1a1a;
          color: #fff;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        
        #container-view {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }
        
        #container-view img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        
        .temp-sensor {
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          font-weight: bold;
          color: white;
          text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
          box-shadow: 0 4px 15px rgba(255,255,255,0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transform: translate(-50%, -50%);
          backdrop-filter: blur(3px);
          transition: all 0.3s ease;
          border: 3px solid rgba(255,255,255,0.6);
        }
        
        .temp-sensor:hover {
          transform: translate(-50%, -50%) scale(1.1);
          box-shadow: 0 6px 20px rgba(255,255,255,0.6);
        }
        
        .building-label {
          font-size: 11px;
          opacity: 0.95;
          margin-bottom: 3px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .temp-value {
          font-size: 20px;
          font-weight: bold;
        }
        
        #legend-container {
          position: fixed;
          top: 20px;
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
        
        #status {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(44, 62, 80, 0.9);
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }
        
        .error {
          color: #e74c3c;
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
            id="battery-radio" 
            name="metric" 
            value="battery"
            checked={selectedMetric === 'battery'}
            onChange={(e) => setSelectedMetric(e.target.value as SensorType)}
          />
          <label htmlFor="battery-radio">Battery</label>
        </div>
      </div>

      <div id="container-view">
        <img src="/3d_map.jpg" alt="Site Plan" />
        
        {buildingPositions.map((pos, index) => (
          <div 
            key={index}
            className="temp-sensor" 
            style={{
              top: pos.top, 
              left: pos.left,
              backgroundColor: backgroundColor
            }}
          >
            <div className="building-label">Building {index + 1}</div>
            <div className="temp-value">
              {value !== null ? value.toFixed(1) : '--'}{unit}
            </div>
          </div>
        ))}
        
        <div id="status">
          {error ? (
            <span className="error">Error: {error}</span>
          ) : lastUpdate ? (
            `Last update: ${lastUpdate.toLocaleTimeString()}`
          ) : (
            'Connecting...'
          )}
        </div>
      </div>
    </>
  );
}