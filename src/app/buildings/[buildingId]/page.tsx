export default function BuildingPage({ 
    params 
  }: { 
    params: { buildingId: string } 
  }) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Building {params.buildingId}</h1>
        <p className="text-gray-600">
          This page will show detailed metrics and charts for this building.
        </p>
        <div className="mt-8 bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-500">Building details coming soon...</p>
        </div>
      </div>
    );
  }