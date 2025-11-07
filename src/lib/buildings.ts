// Device type definitions with their available sensors
export type DeviceType = 'EM300-TH' | 'EM300-DI';

export interface DeviceTypeConfig {
  sensors: string[];
}

export const deviceTypes: Record<DeviceType, DeviceTypeConfig> = {
  'EM300-TH': {
    sensors: ['temperature', 'humidity', 'battery']
  },
  'EM300-DI': {
    sensors: ['battery', 'temperature', 'humidity', 'water']
  }
};

export interface SensorMapping {
  temperature?: string;
  humidity?: string;
  battery?: string;
  energy?: string; // Gas meters (pulse counters)
  electricity?: string; // Electricity meters
}



export interface Device {
  deviceId: string;
  name: string;
  type: DeviceType;
  location?: string;
  sensors?: string[]; // Auto-populated from type, but can override if needed
  conversionFactor?: number; // kWh/pulse conversion factor for gas/oil meters
  energyType?: 'gas' | 'electricity' | 'oil'; // Type of energy this device measures
}

export const gas_kWh_L = 0.01116; // kWh per litre of gas(approx)
export const oil_kWh_L = 10.35; // kWh per litre (approx)

export interface Building {
  id: string;
  name: string;
  area: number;
  coordinates: { 
    top: string; 
    left: string; 
  };
  devices: Device[];
  primarySensors: SensorMapping;
}

// Site-level configuration
export interface SiteConfig {
  electricityDeviceId?: string; // Device ID for main site electricity meter
  electricityConversionFactor?: number; // Conversion factor for electricity meter
  oatSensorDeviceId?: string; // Device ID for outside air temperature sensor 
}

export const siteConfig: SiteConfig = {
  electricityDeviceId: 'uncategorised', // Replace with your actual electricity meter device ID
  electricityConversionFactor: 1, // Adjust based on your meter's pulse/kWh ratio
  oatSensorDeviceId: 'TH-02', // Device ID for outside air temperature sensor 
};

export const buildings: Building[] = [
  {
    id: '1',
    name: 'Mansion House',
    area: 2500,
    coordinates: { top: '62%', left: '76%' },
    devices: [
      { 
        deviceId: 'PC-03', 
        name: 'Mansion House - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: oil_kWh_L,
        energyType: 'oil'
      },
      { 
        deviceId: 'TH-03', 
        name: 'Mansion House - TH sensor',
        type: 'EM300-TH',
        location: 'First floor landing',
      },
    ],
    primarySensors: {
      temperature: 'TH-03',
      humidity: 'TH-03',
      energy: 'PC-03',
    }
  },
  {
    id: '2',
    name: 'Mansion Top Floor',
    area: 1800,
    coordinates: { top: '60%', left: '72%' },
    devices: [
      { 
        deviceId: 'PC-04', 
        name: 'Mansion Top Floor - Gas',
        type: 'EM300-DI',
        location: 'Coelho',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
     { 
        deviceId: 'TH-04', 
        name: 'Mansion Top floor - TH sensor',
        type: 'EM300-TH',
        location: 'Reading Room',
      },
    ],
    primarySensors: {
      temperature: 'TH-04',
      humidity: 'TH-04',
      energy: 'PC-04',
    } 
  },
  {
    id: '3',
    name: 'The Round House',
    area: 3200,
    coordinates: { top: '60%', left: '67.5%' },
    devices: [
      { 
        deviceId: 'PC-05', 
        name: 'Round House - Gas',
        type: 'EM300-DI',
        location: 'Old Schoolhouse',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
      { 
        deviceId: 'TH-05', 
        name: 'Round house - TH sensor',
        type: 'EM300-TH',
        location: 'Round house',
      },
    
    ],
    primarySensors: {
      temperature: 'TH-05',
      humidity: 'TH-05',
      energy: 'PC-05',
    }
  },
  {
    id: '4',
    name: 'Headmaster\'s House',
    area: 200,
    coordinates: { top: '67%', left: '39%' },
    devices: [
      { 
        deviceId: 'PC-20', 
        name: 'Headmasters - Gas',
        type: 'EM300-DI',
        location: 'Headmasters house',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
      { 
        deviceId: 'TH-20', 
        name: 'Headmasters - TH sensor',
        type: 'EM300-TH',
        location: 'Headmasters house',
      },
    ],
    primarySensors: {
      temperature: 'TH-20',
      humidity: 'TH-20',
      energy: 'PC-20',
    }
  },
  {
    id: '5',
    name: 'Dining Hall',
    area: 1500,
    coordinates: { top: '36%', left: '48%' },
    devices: [
      { 
        deviceId: 'PC-06', 
        name: 'Dining Hall - Gas',
        type: 'EM300-DI',
        location: 'External gas cupboard',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
      { 
        deviceId: 'TH-06', 
        name: 'Dining hall - TH sensor',
        type: 'EM300-TH',
        location: 'Dining Hall',
      },
    ],
    primarySensors: {
      temperature: 'TH-06',
      humidity: 'TH-06',
      energy: 'PC-06',
    }
  },
  {
    id: '6',
    name: 'Art & Textiles',
    area: 1400,
    coordinates: { top: '55%', left: '65%' },
    devices: [
      { 
        deviceId: 'PC-07', 
        name: 'Art & Textiles - Oil',
        type: 'EM300-DI',
        location: 'Art boiler room',
        conversionFactor: oil_kWh_L,
        energyType: 'oil'
      },
      { 
        deviceId: 'TH-17', 
        name: 'Art - TH sensor',
        type: 'EM300-TH',
        location: 'Art room',
      },
    ],
    primarySensors: {
      temperature: 'TH-07',
      humidity: 'TH-07',
      energy: 'PC-07',
    }
  },
  {
    id: '7',
    name: 'Old Schoolhouse',
    area: 800,
    coordinates: { top: '62%', left: '65%' },
    devices: [
      { 
        deviceId: 'PC-08', 
        name: 'Old Schoolhouse - Gas',
        type: 'EM300-DI',
        location: 'Shop Store',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
      { 
        deviceId: 'TH-08', 
        name: 'Old Schoolhouse - TH sensor',
        type: 'EM300-TH',
        location: 'School Shop',
      },
    ],
    primarySensors: {
      temperature: 'TH-08',
      humidity: 'TH-08',
      energy: 'PC-08',
    }
  },
  {
    id: '8',
    name: 'Medical & Bell Tower',
    area: 900,
    coordinates: { top: '53%', left: '61%' },
    devices: [
      { 
        deviceId: 'PC-09', 
        name: 'Medical - Gas',
        type: 'EM300-DI',
        location: 'Boilee cupboard',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
      { 
        deviceId: 'TH-09', 
        name: 'Bell Tower - TH sensor',
        type: 'EM300-TH',
        location: 'Girls Changing Rooms',
      },
    ],
    primarySensors: {
      temperature: 'TH-09',
      humidity: 'TH-09',
      energy: 'PC-09',
    }
  },
  {
    id: '9',
    name: 'The Grove',
    area: 600,
    coordinates: { top: '62%', left: '56%' },
    devices: [
      { 
        deviceId: 'PC-10', 
        name: 'The grove - Gas',
        type: 'EM300-DI',
        location: 'Laundry room',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
      { 
        deviceId: 'TH-10', 
        name: 'Grove - TH sensor',
        type: 'EM300-TH',
        location: 'Classroom',
      },
    ],
    primarySensors: {
      temperature: 'TH-10',
      humidity: 'TH-10',
      energy: 'PC-10',
    }
  },
  {
    id: '10',
    name: 'Sports Hall',
    area: 2000,
    coordinates: { top: '34%', left: '22%' },
    devices: [
      { 
        deviceId: 'PC-11', 
        name: 'Sports - Gas',
        type: 'EM300-DI',
        location: 'Sports plantroom',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
      { 
        deviceId: 'TH-11', 
        name: 'Sports - TH sensor',
        type: 'EM300-TH',
        location: 'Sports Hall',
      },
    ],
    primarySensors: {
      temperature: 'TH-11',
      humidity: 'TH-11',
      energy: 'PC-11',
    }
  },
  {
    id: '11',
    name: 'Vanbrugh',
    area: 2000,
    coordinates: { top: '44%', left: '35%' },
    devices: [
      { 
        deviceId: 'PC-12', 
        name: 'Vanbrugh - Gas',
        type: 'EM300-DI',
        location: 'Vanbrugh boiler room',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
      { 
        deviceId: 'TH-12', 
        name: 'Vanbrugh - TH sensor',
        type: 'EM300-TH',
        location: 'Classroom',
      },
    ],
    primarySensors: {
      temperature: 'TH-12',
      humidity: 'TH-12',
      energy: 'PC-12',
    }
  },
  {
    id: '12',
    name: 'The Shed',
    area: 2000,
    coordinates: { top: '32%', left: '27%' },
    devices: [
      { 
        deviceId: 'PC-13', 
        name: 'The Shed - Gas',
        type: 'EM300-DI',
        location: 'The Shed external AHU',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
      { 
        deviceId: 'TH-13', 
        name: 'Shed - TH sensor',
        type: 'EM300-TH',
        location: 'Theatre',
      },
    ],
    primarySensors: {
      temperature: 'TH-13',
      humidity: 'TH-13',
      energy: 'PC-13',
    }
  },
  {
    id: '13',
    name: 'Pavilion',
    area: 400,
    coordinates: { top: '38%', left: '68%' },
    devices: [
      { 
        deviceId: 'PC-14', 
        name: 'Pavilion - Gas',
        type: 'EM300-DI',
        location: 'Tank Room',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
      { 
        deviceId: 'TH-14', 
        name: 'DT - TH sensor',
        type: 'EM300-TH',
        location: 'Los Angeles Changing room',
      },
    ],
    primarySensors: {
      temperature: 'TH-14',
      humidity: 'TH-14',
      energy: 'PC-14',
    }
  },
  {
    id: '14',
    name: 'SWIFT & Academic Building',
    area: 1100,
    coordinates: { top: '54%', left: '42%' },
    devices: [
      { 
        deviceId: 'PC-15', 
        name: 'SWIFT - Gas',
        type: 'EM300-DI',
        location: 'SWIFT boiler room',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
      { 
        deviceId: 'TH-15', 
        name: 'SWIFT - TH sensor',
        type: 'EM300-TH',
        location: 'SWIFT classroom',
      },
    ],
    primarySensors: {
      temperature: 'TH-15',
      humidity: 'TH-15',
      energy: 'PC-15',
    }
  },
  {
    id: '15',
    name: 'Teacher\'s Common Room',
    area: 1600,
    coordinates: { top: '58%', left: '59%' },
    devices: [
      { 
        deviceId: 'PC-16', 
        name: 'Teachers Common room - gas boiler',
        type: 'EM300-DI',
        location: 'Teachers kitchen',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
      { 
        deviceId: 'TH-16', 
        name: 'Teachers common room - TH sensor',
        type: 'EM300-TH',
        location: 'Common room',
      },
    ],
    primarySensors: {
      temperature: 'TH-16',
      humidity: 'TH-16',
      energy: 'PC-16',
    }
  },
  {
    id: '16',
    name: 'DT',
    area: 600,
    coordinates: { top: '41%', left: '42%' },
    devices: [
      { 
        deviceId: 'PC-17', 
        name: 'DT - Gas',
        type: 'EM300-DI',
        location: 'IT office',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
      { 
        deviceId: 'TH-17', 
        name: 'DT - TH sensor',
        type: 'EM300-TH',
        location: 'DT',
      },
    ],
    primarySensors: {
      temperature: 'TH-17',
      humidity: 'TH-17',
      energy: 'PC-17',
    }
  },
  {
    id: '17',
    name: 'Kitchen',
    area: 600,
    coordinates: { top: '30%', left: '45%' },
    devices: [
      { 
        deviceId: 'PC-18', 
        name: 'Kitchen - Gas',
        type: 'EM300-DI',
        location: 'External Gas cupboard',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
      { 
        deviceId: 'TH-18', 
        name: 'Kitchen - TH sensor',
        type: 'EM300-TH',
        location: 'Kitchen',
      },
    ],
    primarySensors: {
      temperature: 'TH-18',
      humidity: 'TH-18',
      energy: 'PC-18',
    }
  },
  {
    id: '18',
    name: 'Music',
    area: 400,
    coordinates: { top: '53%', left: '48%' },
    devices: [
      { 
        deviceId: 'PC-19', 
        name: 'Music - Gas',
        type: 'EM300-DI',
        location: 'External gas cupboard',
        conversionFactor: gas_kWh_L,
        energyType: 'gas'
      },
      { 
        deviceId: 'TH-19', 
        name: 'Music - TH sensor',
        type: 'EM300-TH',
        location: 'Music Room',
      },
    ],
    primarySensors: {
      temperature: 'TH-19',
      humidity: 'TH-19',
      energy: 'PC-19',
    }
  }
];

// Helper functions
export function getBuildingById(id: string): Building | undefined {
  return buildings.find(b => b.id === id);
}

export function getBuildingName(id: string): string {
  const building = getBuildingById(id);
  return building?.name || `Building ${id}`;
}

export function getPrimarySensorDevice(buildingId: string, sensorType: string): string | undefined {
  const building = getBuildingById(buildingId);
  return building?.primarySensors[sensorType as keyof SensorMapping];
}

export function getAllDevicesForBuilding(buildingId: string): Device[] {
  const building = getBuildingById(buildingId);
  return building?.devices || [];
}

export function getDeviceById(buildingId: string, deviceId: string): Device | undefined {
  const devices = getAllDevicesForBuilding(buildingId);
  return devices.find(d => d.deviceId === deviceId);
}

// Get available sensors for a device based on its type
export function getDeviceSensors(device: Device): string[] {
  return device.sensors || deviceTypes[device.type].sensors;
}

// Check if a device has a specific sensor
export function deviceHasSensor(device: Device, sensorType: string): boolean {
  const sensors = getDeviceSensors(device);
  return sensors.includes(sensorType);
}

// Helper to get conversion factor for a device
export function getDeviceConversionFactor(buildingId: string, deviceId: string): number | undefined {
  const building = getBuildingById(buildingId);
  const device = building?.devices.find(d => d.deviceId === deviceId);
  return device?.conversionFactor; // return undefined when not set
}

// Get all gas devices across all buildings
export function getAllGasDevices(): { buildingId: string; buildingName: string; deviceId: string; conversionFactor?: number }[] {
  const gasDevices: { buildingId: string; buildingName: string; deviceId: string; conversionFactor?: number }[] = [];
  
  buildings.forEach(building => {
    building.devices.forEach(device => {
      if (device.energyType === 'gas' && device.deviceId) {
        gasDevices.push({
          buildingId: building.id,
          buildingName: building.name,
          deviceId: device.deviceId,
          conversionFactor: device.conversionFactor // may be undefined
        });
      }
    });
  });
  
  return gasDevices;
}

export function getAllOilDevices(): { buildingId: string; buildingName: string; deviceId: string; conversionFactor?: number }[] {
  const oilDevices: { buildingId: string; buildingName: string; deviceId: string; conversionFactor?: number }[] = [];
  
  buildings.forEach(building => {
    building.devices.forEach(device => {
      if (device.energyType === 'oil' && device.deviceId) {
        oilDevices.push({
          buildingId: building.id,
          buildingName: building.name,
          deviceId: device.deviceId,
          conversionFactor: device.conversionFactor // may be undefined
        });
      }
    });
  });
  
  return oilDevices;
}

// Get site electricity device info
export function getSiteElectricityDevice(): { deviceId: string; conversionFactor?: number } | null {
  if (siteConfig.electricityDeviceId) {
    return {
      deviceId: siteConfig.electricityDeviceId,
      conversionFactor: siteConfig.electricityConversionFactor // may be undefined
    };
  }
  return null;
}