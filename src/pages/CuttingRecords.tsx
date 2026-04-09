import React, { useState, useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { CuttingRecord } from '../types/database';

const CuttingRecords: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [records, setRecords] = useState<CuttingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady && db) {
      loadRecords();
    }
  }, [isReady, db]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await db!.getAll<CuttingRecord>('cuttingRecords');
      setRecords(data.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.error("Failed to load records", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-eecol-blue">Wire Cut Records</h1>
        <p className="text-sm text-gray-600">Manage and track your wire cutting operations.</p>
      </header>

      <div className="flex-1 overflow-auto bg-white rounded-lg shadow p-4">
        {loading ? (
          <div className="flex justify-center p-8">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="text-center p-8 text-gray-500">No records found. Start by adding a new cut.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Date</th>
                <th className="p-2">Cutter</th>
                <th className="p-2">Wire ID</th>
                <th className="p-2">Length</th>
                <th className="p-2">Order #</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{new Date(record.timestamp).toLocaleString()}</td>
                  <td className="p-2">{record.cutterName}</td>
                  <td className="p-2">{record.wireId}</td>
                  <td className="p-2">{record.cutLength}</td>
                  <td className="p-2">{record.orderNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CuttingRecords;
