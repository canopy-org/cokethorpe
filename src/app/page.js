'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [selectedMetric, setSelectedMetric] = useState('temperature');

  useEffect(() => {
    const CONFIG = {
      influxUrl: 'https://influx.gedata.uk',
      token: 'XZFvjXEqKubXQGXlYg3YOYlTjL_puyp295Ki_jrDmW8o40OaJHok09PmsFHZLpOCrwT6G_sLL3jANOiaM-pXWg==',
      org: 'GEData',
      bucket: 'lora_peckham_pulse',
      _measurement: 'alldata',
      _field: selectedMetric,
      updateInterval: 5000
    };

    function getTemperatureColor(temp) {
      if (temp < 15) return '#3498db';    // Cold - Blue
      if (temp < 18) return '#2ecc71';    // Good - Green
      if (temp < 21) return '#f39c12';    // Warm - Amber/Orange
      return '#e74c3c';                   // Hot - Red
    }

    function getHumidityColor(humidity) {
      if (humidity < 30) return '#e74c3c';    // Too dry - Red
      if (humidity < 40) return '#f39c12';    // Low - Amber
      if (humidity < 60) return '#2ecc71';    // Good - Green
      if (humidity < 70) return '#f39c12';    // High - Amber
      return '#3498db';                       // Too humid - Blue
    }

    function getBatteryColor(battery) {
      if (battery < 20) return '#e74c3c';     // Critical - Red
      if (battery < 40) return '#f39c12';     // Low - Amber
      if (battery < 80) return '#2ecc71';     // Good - Green
      return '#27ae60';                       // Full - Dark Green
    }

    function getColor(value, metric) {
      switch(metric) {
        case 'temperature':
          return getTemperatureColor(value);
        case 'humidity':
          return getHumidityColor(value);
        case 'battery':
          return getBatteryColor(value);
        default:
          return '#95a5a6';
      }
    }

    function getUnit(metric) {
      switch(metric) {
        case 'temperature':
          return '°C';
        case 'humidity':
          return '%';
        case 'battery':
          return '%';
        default:
          return '';
      }
    }

    function updateSensor(elementId, value) {
      const element = document.getElementById(elementId);
      if (!element) return;
      
      const valueElement = element.querySelector('.temp-value');
      if (!valueElement) return;
      
      if (value !== null && !isNaN(value)) {
        // Update the text content AND the data attribute
        valueElement.textContent = value.toFixed(1);
        element.style.backgroundColor = getColor(value, selectedMetric);
      } else {
        valueElement.textContent = '--';
        element.style.backgroundColor = '#95a5a6';
      }
    }

    async function queryInfluxDB() {
      try {
        const query = `
          from(bucket: "${CONFIG.bucket}")
            |> range(start: -2h)
            |> filter(fn: (r) => r._measurement == "${CONFIG._measurement}")
            |> filter(fn: (r) => r._field == "${CONFIG._field}")
            |> last()
        `;

        const response = await fetch(`${CONFIG.influxUrl}/api/v2/query?org=${CONFIG.org}`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${CONFIG.token}`,
            'Content-Type': 'application/vnd.flux',
            'Accept': 'application/csv'
          },
          body: query
        });

        if (!response.ok) {
          throw new Error(`InfluxDB error: ${response.status}`);
        }

        const csvData = await response.text();
        const value = parseInfluxCSV(csvData);
        console.log('Parsed value:', value, 'for metric:', selectedMetric);
        
        // Update all 15 buildings with the same value
        for (let i = 1; i <= 15; i++) {
          updateSensor(`building-${i}`, value);
        }
        
        const statusElement = document.getElementById('status');
        if (statusElement) {
          statusElement.textContent = `Last update: ${new Date().toLocaleTimeString()}`;
        }
        
      } catch (error) {
        console.error('Error querying InfluxDB:', error);
        const statusElement = document.getElementById('status');
        if (statusElement) {
          statusElement.innerHTML = `<span class="error">Error: ${error.message}</span>`;
        }
      }
    }

    function parseInfluxCSV(csv) {
      console.log('Raw CSV response:', csv); // Debug log
      
      const lines = csv.trim().split('\n');
      
      const dataLines = lines.filter(line => 
        !line.startsWith('#') && 
        !line.startsWith(',result,') &&
        line.trim() !== ''
      );
    
      console.log('Data lines:', dataLines); // Debug log
    
      if (dataLines.length > 0) {
        const values = dataLines[0].split(',');
        console.log('Split values:', values); // Debug log
        console.log('Value at index 6:', values[6]); // Debug log
        return parseFloat(values[6]);
      }
    
      return null;
    }

    // Initial query
    queryInfluxDB();
    
    // Set up interval
    const interval = setInterval(queryInfluxDB, CONFIG.updateInterval);
    
    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [selectedMetric]); // Re-run when selectedMetric changes

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
        
.temp-value:after {
  content: "${selectedMetric === 'temperature' ? '°C' : '%'}";
  font-size: 14px;
  margin-left: 2px;
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
          background: #e74c3c;
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
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
            onChange={(e) => setSelectedMetric(e.target.value)}
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
            onChange={(e) => setSelectedMetric(e.target.value)}
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
            onChange={(e) => setSelectedMetric(e.target.value)}
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
            id={`building-${index + 1}`} 
            style={{top: pos.top, left: pos.left}}
          >
            <div className="building-label">Building {index + 1}</div>
            <div className="temp-value" data-unit="°C">--</div>
          </div>
        ))}
        
        <div id="status">Connecting...</div>
      </div>
    </>
  );
}