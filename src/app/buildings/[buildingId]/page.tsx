import { getBuildingById, buildings } from '@/lib/buildings';
import { notFound } from 'next/navigation';

export default function BuildingPage({ 
  params 
}: { 
  params: { buildingId: string } 
}) {
  const building = getBuildingById(params.buildingId);

  // If building doesn't exist, show 404
  if (!building) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{building.name}</h1>
      <p className="text-gray-600 mb-6">Building Area: {building.area}m²</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Temperature</h3>
          <p className="text-3xl font-bold mt-2">--°C</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Humidity</h3>
          <p className="text-3xl font-bold mt-2">--%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Energy Usage</h3>
          <p className="text-3xl font-bold mt-2">-- W/m²</p>
        </div>
      </div>
      
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-500">Charts coming soon...</p>
      </div>
    </div>
  );
}

// Generate static params for all buildings (optional - improves performance)
export async function generateStaticParams() {
  return buildings.map((building) => ({
    buildingId: building.id,
  }));
}