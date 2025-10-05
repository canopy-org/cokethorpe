'use client';

import { useState, useEffect } from 'react';
import { SensorType } from '@/types/sensor';
import { buildings } from '@/lib/buildings';
import { useSensorData } from '@/hooks/useSensorData';
import { getColorForMetric, getUnitForMetric } from '@/lib/utils';

function BuildingMarker({ 
  building, 
  selectedMetric 
}: { 
  building: typeof buildings[0], 
  selectedMetric: SensorType 
}) {
  const { value } = useSensorData(selectedMetric, 5000, building.BuildingTag);
  
  const backgroundColor = value !== null 
    ? getColorForMetric(value, selectedMetric) 
    : '#95a5a6';
  const unit = getUnitForMetric(selectedMetric);

  return (
    <div 
      className="temp-sensor" 
      style={{
        top: building.coordinates.top, 
        left: building.coordinates.left,
        backgroundColor: backgroundColor,
      }}
    >
      <div className="building-label">{building.name}</div>
      <div className="temp-value">
        {value !== null ? value.toFixed(1) : '--'}{unit}
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedMetric, setSelectedMetric] = useState<SensorType>('temperature');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Mark as loaded after initial render
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
        
        .temp-sensor {
          position: absolute;
          width: 4.5vw;
          height: 4.5vw;
          min-width: 50px;
          max-width: 90px;
          min-height: 50px;
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
          transform: translate(-50%, -50%);
          backdrop-filter: blur(3px);
          transition: all 0.3s ease;
          border: 3px solid rgba(255,255,255,0.6);
          aspect-ratio: 1;
        }
        
        .temp-sensor:hover {
          transform: translate(-50%, -50%) scale(1.1);
          box-shadow: 0 6px 20px rgba(255,255,255,0.6);
        }
        
        .building-label {
          font-size: 0.65vw;
          opacity: 0.95;
          margin-bottom: 2px;
          font-weight: 600;
          text-transform: uppercase;
          text-align: center;
          width: 100%;
          line-height: 1.1;
          padding: 0 4px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          word-break: break-word;
        }
        
        .temp-value {
          font-size: 1.1vw;
          font-weight: bold;
          text-align: center;
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
            min-width: 50px;
            max-width: 70px;
            min-height: 50px;
            max-height: 70px;
          }
          
          .building-label {
            font-size: 9px;
          }
          
          .temp-value {
            font-size: 14px;
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