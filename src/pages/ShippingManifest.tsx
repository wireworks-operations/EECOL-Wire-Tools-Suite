import React, { useState } from 'react';

const ShippingManifest: React.FC = () => {
  const [formData, setFormData] = useState({
    customerName: '', wireId: '', orderNumber: '', date: new Date().toISOString().split('T')[0],
    amount: '', weight: '', comments: ''
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; border: 4px solid #0058B3;">
          <h1 style="color: #0058B3; text-align: center;">EECOL SHIPPING LABEL</h1>
          <div style="font-size: 24px; margin-bottom: 20px;">
            <p><strong>CUSTOMER:</strong> ${formData.customerName}</p>
            <p><strong>ORDER #:</strong> ${formData.orderNumber}</p>
            <p><strong>WIRE ID:</strong> ${formData.wireId}</p>
            <p><strong>LENGTH:</strong> ${formData.amount}</p>
            <p><strong>WEIGHT:</strong> ${formData.weight}</p>
            <p><strong>DATE:</strong> ${formData.date}</p>
          </div>
          <button onclick="window.print()">Print</button>
        </body>
      </html>
    `);
    printWindow?.print();
  };

  return (
    <div className="flex-1 flex flex-col items-center p-4 animate-entrance pb-24">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/20">
        <h1 className="text-2xl font-black header-gradient text-center mb-6 uppercase">Shipping Manifest / Label</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
           <div className="col-span-2">
              <label className="text-[10px] font-bold header-gradient uppercase">Customer Name</label>
              <input value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value.toUpperCase()})} className="input-premium w-full" />
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Order #</label>
              <input value={formData.orderNumber} onChange={e => setFormData({...formData, orderNumber: e.target.value})} className="input-premium w-full" />
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Date</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="input-premium w-full" />
           </div>
           <div className="col-span-2">
              <label className="text-[10px] font-bold header-gradient uppercase">Wire ID</label>
              <input value={formData.wireId} onChange={e => setFormData({...formData, wireId: e.target.value.toUpperCase()})} className="input-premium w-full" />
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Amount</label>
              <input value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="input-premium w-full" />
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Est. Weight</label>
              <input value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="input-premium w-full" />
           </div>
        </div>

        <button onClick={handlePrint} className="w-full bg-eecol-blue text-white font-bold py-3 rounded-xl btn-tactile mt-6 uppercase">Print Shipping Label</button>
      </div>
    </div>
  );
};

export default ShippingManifest;
