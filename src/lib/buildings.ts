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
  energyType?: 'gas' | 'electricity'; // Type of energy this device measures
}

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
}

export const siteConfig: SiteConfig = {
  electricityDeviceId: 'uncategorised', // Replace with your actual electricity meter device ID
  electricityConversionFactor: 0.1, // Adjust based on your meter's pulse/kWh ratio
};

export const buildings: Building[] = [
  {
    id: '1',
    name: 'Mansion House',
    area: 2500,
    coordinates: { top: '55%', left: '70%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'Mansion House - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 1,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
    }
  },
  {
    id: '2',
    name: 'Mansion Top Floor',
    area: 1800,
    coordinates: { top: '58%', left: '77%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'Mansion Top Floor - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 1,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
    }
  },
  {
    id: '3',
    name: 'The Round House',
    area: 3200,
    coordinates: { top: '60%', left: '67%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'Round House - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 1,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
    }
  },
  {
    id: '4',
    name: 'Library',
    area: 1200,
    coordinates: { top: '38%', left: '52%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'Library - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 1,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
    }
  },
  {
    id: '5',
    name: 'Dining Hall',
    area: 1500,
    coordinates: { top: '30%', left: '45%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'Dining Hall - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 1,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
    }
  },
  {
    id: '6',
    name: 'Arts Building',
    area: 1400,
    coordinates: { top: '53%', left: '65%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'Arts Building - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 1,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
    }
  },
  {
    id: '7',
    name: 'Old Schoolhouse',
    area: 800,
    coordinates: { top: '65%', left: '67%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'Old Schoolhouse - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 1,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
    }
  },
  {
    id: '8',
    name: 'Medical',
    area: 900,
    coordinates: { top: '52%', left: '60%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'Medical - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 1,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
    }
  },
  {
    id: '9',
    name: 'Music',
    area: 600,
    coordinates: { top: '55%', left: '48%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'Music - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 1,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
    }
  },
  {
    id: '10',
    name: 'Sports',
    area: 2000,
    coordinates: { top: '34%', left: '20%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'Sports - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 1,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
    }
  },
  {
    id: '11',
    name: 'Vanbrugh',
    area: 2000,
    coordinates: { top: '45%', left: '32%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'Vanbrugh - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 1,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
    }
  },
  {
    id: '12',
    name: 'The Shed',
    area: 2000,
    coordinates: { top: '29%', left: '27%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'The Shed - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 1,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
    }
  },
  {
    id: '13',
    name: 'Pavilion',
    area: 400,
    coordinates: { top: '35%', left: '70%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'Pavilion - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 1,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
    }
  },
  {
    id: '14',
    name: 'SWIFT',
    area: 1100,
    coordinates: { top: '52%', left: '38%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'SWIFT - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 0.1,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
    }
  },
  {
    id: '15',
    name: 'Staff Room',
    area: 1600,
    coordinates: { top: '59%', left: '59%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'Staff Room - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 3,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
    }
  },
  {
    id: '16',
    name: 'IT',
    area: 600,
    coordinates: { top: '41%', left: '41%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'IT - Gas',
        type: 'EM300-DI',
        location: 'Main Hall',
        conversionFactor: 2,
        energyType: 'gas'
      },
    ],
    primarySensors: {
      temperature: 'uncategorised',
      humidity: 'uncategorised',
      energy: 'uncategorised',
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
export function getDeviceConversionFactor(buildingId: string, deviceId: string): number {
  const building = getBuildingById(buildingId);
  const device = building?.devices.find(d => d.deviceId === deviceId);
  return device?.conversionFactor || 1; // Default to 1 if no conversion needed
}

// Get all gas devices across all buildings
export function getAllGasDevices(): { buildingId: string; buildingName: string; deviceId: string; conversionFactor: number }[] {
  const gasDevices: { buildingId: string; buildingName: string; deviceId: string; conversionFactor: number }[] = [];
  
  buildings.forEach(building => {
    building.devices.forEach(device => {
      if (device.energyType === 'gas' && device.deviceId) {
        gasDevices.push({
          buildingId: building.id,
          buildingName: building.name,
          deviceId: device.deviceId,
          conversionFactor: device.conversionFactor || 1
        });
      }
    });
  });
  
  return gasDevices;
}

// Get site electricity device info
export function getSiteElectricityDevice(): { deviceId: string; conversionFactor: number } | null {
  if (siteConfig.electricityDeviceId) {
    return {
      deviceId: siteConfig.electricityDeviceId,
      conversionFactor: siteConfig.electricityConversionFactor || 1
    };
  }
  return null;
}