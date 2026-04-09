import React from 'react';

const Reports: React.FC = () => {
  return (
    <div className="flex-1">
      <h1 className="text-2xl font-bold text-eecol-blue mb-4">Reports & Statistics</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600">Statistical analysis and charts will be migrated here in Phase 4.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center border-2 border-dashed">
            [Usage Trends Chart]
          </div>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center border-2 border-dashed">
            [Inventory Distribution Chart]
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
