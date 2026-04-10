import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../hooks/useDatabase';

const DatabaseConfig: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isReady && db) {
      const stores = ['cuttingRecords', 'inventoryRecords', 'maintenanceLogs', 'wireCutList'];
      const counts: Record<string, number> = {};
      Promise.all(stores.map(s => db.getAll(s).then(r => counts[s] = r.length))).then(() => setStats({...counts}));
    }
  }, [isReady, db]);

  const handleExport = async () => {
    if (!db) return;
    const allData: any = {};
    const stores = ['cuttingRecords', 'inventoryRecords', 'maintenanceLogs', 'wireCutList', 'settings'];
    for (const s of stores) { allData[s] = await db.getAll(s); }

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eecol_db_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 animate-entrance pb-24 text-left">
      <h1 className="text-3xl font-black header-gradient text-center mb-8 uppercase">Database Configuration</h1>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-eecol-blue/10">
          <h2 className="text-lg font-bold text-eecol-blue dark:text-blue-300 mb-4 uppercase">System Health</h2>
          <div className="grid grid-cols-2 gap-4">
             {Object.entries(stats).map(([store, count]) => (
               <div key={store} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-600">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">{store}</p>
                  <p className="text-lg font-black text-eecol-blue dark:text-white">{count} Records</p>
               </div>
             ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-eecol-blue/10">
          <h2 className="text-lg font-bold text-eecol-blue dark:text-blue-300 mb-4 uppercase">Maintenance & Backup</h2>
          <div className="flex flex-col gap-3">
             <button onClick={handleExport} className="w-full bg-eecol-blue text-white font-bold py-3 rounded-xl btn-tactile uppercase">Generate Full JSON Backup</button>
             <button onClick={async () => {if(confirm('Nuclear Option: Clear ALL data?')){ localStorage.clear(); indexedDB.deleteDatabase('EECOLTools_v2'); window.location.reload(); }}} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl btn-tactile uppercase">Factory Reset (Delete All)</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseConfig;
