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
  energy?: string;
}

export interface Device {
  deviceId: string;
  name: string;
  type: DeviceType;
  location?: string;
  sensors?: string[]; // Auto-populated from type, but can override if needed
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

export const buildings: Building[] = [
  {
    id: '1',
    name: 'Mansion House',
    area: 2500,
    coordinates: { top: '55%', left: '70%' },
    devices: [
      { 
        deviceId: 'uncategorised', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'uncategorised', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
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
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
    ],
    primarySensors: {
      temperature: 'PC-02',
      humidity: 'PC-02',
      energy: 'PC-02',
    }
  },
  {
    id: '3',
    name: 'The Round House',
    area: 3200,
    coordinates: { top: '60%', left: '67%' },
    devices: [
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
    ],
    primarySensors: {
      temperature: 'PC-02',
      humidity: 'PC-02',
      energy: 'PC-02',
    }
  },
  {
    id: '4',
    name: 'Library',
    area: 1200,
    coordinates: { top: '38%', left: '52%' },
    devices: [
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
    ],
    primarySensors: {
      temperature: 'PC-02',
      humidity: 'PC-02',
      energy: 'PC-02',
    }
  },
  {
    id: '5',
    name: 'Dining Hall',
    area: 1500,
    coordinates: { top: '30%', left: '45%' },
    devices: [
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
    ],
    primarySensors: {
      temperature: 'PC-02',
      humidity: 'PC-02',
      energy: 'PC-02',
    }
  },
  {
    id: '6',
    name: 'Arts Building',
    area: 1400,
    coordinates: { top: '53%', left: '65%' },
    devices: [
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
    ],
    primarySensors: {
      temperature: 'PC-02',
      humidity: 'PC-02',
      energy: 'PC-02',
    }
  },
  {
    id: '7',
    name: 'Old Schoolhouse',
    area: 800,
    coordinates: { top: '65%', left: '67%' },
    devices: [
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
    ],
    primarySensors: {
      temperature: 'PC-02',
      humidity: 'PC-02',
      energy: 'PC-02',
    }
  },
  {
    id: '8',
    name: 'Medical',
    area: 900,
    coordinates: { top: '52%', left: '60%' },
    devices: [
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
    ],
    primarySensors: {
      temperature: 'PC-02',
      humidity: 'PC-02',
      energy: 'PC-02',
    }
  },
  {
    id: '9',
    name: 'Music',
    area: 600,
    coordinates: { top: '55%', left: '48%' },
    devices: [
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
    ],
    primarySensors: {
      temperature: 'PC-02',
      humidity: 'PC-02',
      energy: 'PC-02',
    }
  },
  {
    id: '10',
    name: 'Sports',
    area: 2000,
    coordinates: { top: '34%', left: '20%' },
    devices: [
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
    ],
    primarySensors: {
      temperature: 'PC-02',
      humidity: 'PC-02',
      energy: 'PC-02',
    }
  },
  {
    id: '11',
    name: 'Vanbrugh',
    area: 2000,
    coordinates: { top: '45%', left: '32%' },
    devices: [
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
    ],
    primarySensors: {
      temperature: 'PC-02',
      humidity: 'PC-02',
      energy: 'PC-02',
    }
  },
  {
    id: '12',
    name: 'The Shed',
    area: 2000,
    coordinates: { top: '29%', left: '27%' },
    devices: [
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
    ],
    primarySensors: {
      temperature: 'PC-02',
      humidity: 'PC-02',
      energy: 'PC-02',
    }
  },
  {
    id: '13',
    name: 'Pavilion',
    area: 400,
    coordinates: { top: '35%', left: '70%' },
    devices: [
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
    ],
    primarySensors: {
      temperature: 'PC-02',
      humidity: 'PC-02',
      energy: 'PC-02',
    }
  },
  {
    id: '14',
    name: 'SWIFT',
    area: 1100,
    coordinates: { top: '52%', left: '38%' },
    devices: [
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
    ],
    primarySensors: {
      temperature: 'PC-02',
      humidity: 'PC-02',
      energy: 'PC-02',
    }
  },
  {
    id: '15',
    name: 'Staff Room',
    area: 1600,
    coordinates: { top: '59%', left: '59%' },
    devices: [
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
    ],
    primarySensors: {
      temperature: 'PC-02',
      humidity: 'PC-02',
      energy: 'PC-02',
    }
  },
  {
    id: '16',
    name: 'IT',
    area: 600,
    coordinates: { top: '41%', left: '41%' },
    devices: [
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
      { 
        deviceId: 'PC-02', 
        name: 'Mansion House - Main',
        type: 'EM300-DI',
        location: 'Main Hall'
      },
    ],
    primarySensors: {
      temperature: 'PC-02',
      humidity: 'PC-02',
      energy: 'PC-02',
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
