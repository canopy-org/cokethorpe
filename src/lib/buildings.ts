export interface Building {
    id: string;
    name: string;
    area: number; // Square meters
    coordinates: { 
      top: string; 
      left: string; 
    }; // Position on map
  }
  
  export const buildings: Building[] = [
    {
      id: '1',
      name: 'Main Hall',
      area: 2500,
      coordinates: { top: '15%', left: '20%' }
    },
    {
      id: '2',
      name: 'Science Block',
      area: 1800,
      coordinates: { top: '25%', left: '45%' }
    },
    {
      id: '3',
      name: 'Sports Centre',
      area: 3200,
      coordinates: { top: '18%', left: '70%' }
    },
    {
      id: '4',
      name: 'Library',
      area: 1200,
      coordinates: { top: '35%', left: '15%' }
    },
    {
      id: '5',
      name: 'Dining Hall',
      area: 1500,
      coordinates: { top: '40%', left: '55%' }
    },
    {
      id: '6',
      name: 'Arts Building',
      area: 1400,
      coordinates: { top: '38%', left: '80%' }
    },
    {
      id: '7',
      name: 'Admin Block',
      area: 800,
      coordinates: { top: '55%', left: '25%' }
    },
    {
      id: '8',
      name: 'Music School',
      area: 900,
      coordinates: { top: '52%', left: '50%' }
    },
    {
      id: '9',
      name: 'Chapel',
      area: 600,
      coordinates: { top: '58%', left: '75%' }
    },
    {
      id: '10',
      name: 'Boarding House A',
      area: 2000,
      coordinates: { top: '70%', left: '18%' }
    },
    {
      id: '11',
      name: 'Boarding House B',
      area: 2000,
      coordinates: { top: '68%', left: '42%' }
    },
    {
      id: '12',
      name: 'Boarding House C',
      area: 2000,
      coordinates: { top: '72%', left: '68%' }
    },
    {
      id: '13',
      name: 'Groundskeeper',
      area: 400,
      coordinates: { top: '82%', left: '30%' }
    },
    {
      id: '14',
      name: 'Theatre',
      area: 1100,
      coordinates: { top: '85%', left: '60%' }
    },
    {
      id: '15',
      name: 'Pool House',
      area: 1600,
      coordinates: { top: '80%', left: '85%' }
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