import React, { useState } from 'react';

const ReelLabels: React.FC = () => {
  const [formData, setFormData] = useState({ wireId: '', length: '', unit: 'm', lineCode: '' });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <html>
        <body style="font-family: sans-serif; padding: 20px; text-align: center; border: 2px solid #0058B3;">
          <h1 style="color: #0058B3; font-size: 48px; margin: 20px 0;">${formData.wireId.toUpperCase()}</h1>
          <h2 style="font-size: 36px; margin: 10px 0;">${formData.length} ${formData.unit}</h2>
          <h2 style="color: #0058B3; font-size: 36px; margin: 10px 0;">L:${formData.lineCode.toUpperCase()}</h2>
          <button onclick="window.print()">Print</button>
        </body>
      </html>
    `);
    printWindow?.print();
  };

  return (
    <div className="flex-1 flex flex-col items-center p-4 animate-entrance pb-24">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/20">
        <h1 className="text-2xl font-black header-gradient text-center mb-6 uppercase">Reel Inventory Labels</h1>

        <div className="space-y-4 text-left">
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Wire ID</label>
              <input value={formData.wireId} onChange={e => setFormData({...formData, wireId: e.target.value.toUpperCase()})} className="input-premium w-full" />
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Length</label>
              <div className="flex gap-1">
                <input value={formData.length} onChange={e => setFormData({...formData, length: e.target.value})} className="input-premium flex-1" />
                <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="input-premium w-20 dark:bg-slate-700"><option value="m">m</option><option value="ft">ft</option></select>
              </div>
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Line #</label>
              <input value={formData.lineCode} onChange={e => setFormData({...formData, lineCode: e.target.value.toUpperCase()})} className="input-premium w-full" maxLength={3} />
           </div>

           <button onClick={handlePrint} className="w-full bg-eecol-blue text-white font-bold py-3 rounded-xl btn-tactile mt-2 uppercase">Generate Large Label</button>
        </div>
      </div>
    </div>
  );
};

export default ReelLabels;
