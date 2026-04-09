import React, { useState, useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { InventoryRecord } from '../types/database';

const InventoryRecords: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady && db) {
      loadItems();
    }
  }, [isReady, db]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await db!.getAll<InventoryRecord>('inventoryRecords');
      setItems(data.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-eecol-blue">Wire Inventory Records</h1>
        <p className="text-sm text-gray-600">Monitor and update wire inventory levels.</p>
      </header>

      <div className="flex-1 overflow-auto bg-white rounded-lg shadow p-4">
        {loading ? (
          <div className="flex justify-center p-8">Loading inventory...</div>
        ) : items.length === 0 ? (
          <div className="text-center p-8 text-gray-500">No inventory items found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Wire Type</th>
                <th className="p-2">Product Code</th>
                <th className="p-2">Actual Length</th>
                <th className="p-2">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{item.wireType}</td>
                  <td className="p-2">{item.productCode}</td>
                  <td className="p-2">{item.actualLength}</td>
                  <td className="p-2">{new Date(item.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InventoryRecords;
