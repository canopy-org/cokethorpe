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
      coordinates: { top: '15%', left: '20%' },
      BuildingTag: '1'
    },
    {
      id: '2',
      name: 'Mansion Top Floor',
      area: 1800,
      coordinates: { top: '25%', left: '45%' },
      BuildingTag: '2'
    },
    {
      id: '3',
      name: 'The Round House',
      area: 3200,
      coordinates: { top: '18%', left: '70%' },
      BuildingTag: '3'
    },
    {
      id: '4',
      name: 'Library',
      area: 1200,
      coordinates: { top: '35%', left: '15%' },
      BuildingTag: '4'
    },
    {
      id: '5',
      name: 'Dining Hall',
      area: 1500,
      coordinates: { top: '40%', left: '55%' },
      BuildingTag: '5'
    },
    {
      id: '6',
      name: 'Arts Building',
      area: 1400,
      coordinates: { top: '38%', left: '80%' },
      BuildingTag: '6'
    },
    {
      id: '7',
      name: 'Old Schoolhouse',
      area: 800,
      coordinates: { top: '55%', left: '25%' },
      BuildingTag: '7'
    },
    {
      id: '8',
      name: 'Drama',
      area: 900,
      coordinates: { top: '52%', left: '50%' },
      BuildingTag: '8'
    },
    {
      id: '9',
      name: 'Music',
      area: 600,
      coordinates: { top: '58%', left: '75%' },
      BuildingTag: '9'
    },
    {
      id: '10',
      name: 'Sports',
      area: 2000,
      coordinates: { top: '70%', left: '18%' },
      BuildingTag: '10'
    },
    {
      id: '11',
      name: 'Headmaster\'s House',
      area: 2000,
      coordinates: { top: '68%', left: '42%' },
          BuildingTag: '11'
    },
    {
      id: '12',
      name: 'The Shed',
      area: 2000,
      coordinates: { top: '72%', left: '68%' },
      BuildingTag: '12'
    },
    {
      id: '13',
      name: 'Pavilion',
      area: 400,
      coordinates: { top: '82%', left: '30%' },
      BuildingTag: '13'
    },
    {
      id: '14',
      name: 'SWIFT',
      area: 1100,
      coordinates: { top: '85%', left: '60%' },
      BuildingTag: '14'
    },
    {
      id: '15',
      name: 'Staff Room',
      area: 1600,
      coordinates: { top: '80%', left: '85%' },
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