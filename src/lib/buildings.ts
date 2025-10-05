export interface Building {
    id: string;
    name: string;
    area: number; // Square meters
    coordinates: { 
      top: string; 
      left: string; 
    };
    BuildingTag?: string; // the Tag of the building in the Influx DB database
  }
  
  export const buildings: Building[] = [
    {
      id: '1',
      name: 'Mansion House',
      area: 2500,
      coordinates: { top: '55%', left: '70%' },
      BuildingTag: '1'
    },
    {
      id: '2',
      name: 'Mansion Top Floor',
      area: 1800,
      coordinates: { top: '58%', left: '77%' },
      BuildingTag: '2'
    },
    {
      id: '3',
      name: 'The Round House',
      area: 3200,
      coordinates: { top: '60%', left: '67%' },
      BuildingTag: '3'
    },
    {
      id: '4',
      name: 'Library',
      area: 1200,
      coordinates: { top: '38%', left: '52%' },
      BuildingTag: '4'
    },
    {
      id: '5',
      name: 'Dining Hall',
      area: 1500,
      coordinates: { top: '30%', left: '45%' },
      BuildingTag: '5'
    },
    {
      id: '6',
      name: 'Arts Building',
      area: 1400,
      coordinates: { top: '53%', left: '65%' },
      BuildingTag: '6'
    },
    {
      id: '7',
      name: 'Old Schoolhouse',
      area: 800,
      coordinates: { top: '65%', left: '67%' },
      BuildingTag: '7'
    },
    {
      id: '8',
      name: 'Medical',
      area: 900,
      coordinates: { top: '52%', left: '60%' },
      BuildingTag: '8'
    },
    {
      id: '9',
      name: 'Music',
      area: 600,
      coordinates: { top: '55%', left: '48%' },
      BuildingTag: '9'
    },
    {
      id: '10',
      name: 'Sports',
      area: 2000,
      coordinates: { top: '34%', left: '20%' },
      BuildingTag: '10'
    },
    {
      id: '11',
      name: 'Vanbrugh',
      area: 2000,
      coordinates: { top: '45%', left: '32%' },
          BuildingTag: '11'
    },
    {
      id: '12',
      name: 'The Shed',
      area: 2000,
      coordinates: { top: '29%', left: '27%' },
      BuildingTag: '12'
    },
    {
      id: '13',
      name: 'Pavilion',
      area: 400,
      coordinates: { top: '35%', left: '70%' },
      BuildingTag: '13'
    },
    {
      id: '14',
      name: 'SWIFT',
      area: 1100,
      coordinates: { top: '52%', left: '38%' },
      BuildingTag: '14'
    },
    {
      id: '15',
      name: 'Staff Room',
      area: 1600,
      coordinates: { top: '59%', left: '59%' },
      BuildingTag: '15'
    },
    {
      id: '16',
      name: 'IT',
      area: 600,
      coordinates: { top: '41%', left: '41%' },
      BuildingTag: '15'
    }
  ];
  
  // Helper function to get building by ID
  export function getBuildingById(id: string): Building | undefined {
    return buildings.find(b => b.id === id);
  }
  
  // Helper function to get building name
  export function getBuildingName(id: string): string {
    const building = getBuildingById(id);
    return building?.name || `Building ${id}`;
  }