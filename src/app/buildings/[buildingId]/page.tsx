import { getBuildingById, buildings } from '@/lib/buildings';
import { notFound } from 'next/navigation';
import BuildingMetrics from '@/components/building/BuildingMetrics';
import BuildingCharts from '@/components/building/BuildingCharts';

export default async function BuildingPage({ 
  params 
}: { 
  params: Promise<{ buildingId: string }>
}) {
  const { buildingId } = await params;
  const building = getBuildingById(buildingId);

  if (!building) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Building Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{building.name}</h1>
          <div className="flex gap-4 text-gray-600">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Building ID: {building.id}
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Area: {building.area.toLocaleString()}m²
            </span>
          </div>
        </div>

        {/* Live Metrics */}
        <BuildingMetrics />

        {/* Charts Section */}
        <BuildingCharts />
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return buildings.map((building) => ({
    buildingId: building.id,
  }));
}