import React, { useState } from 'react';

const MarkCalculator: React.FC = () => {
  const [startMark, setStartMark] = useState<string>('');
  const [endMark, setEndMark] = useState<string>('');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const start = parseFloat(startMark);
    const end = parseFloat(endMark);
    if (!isNaN(start) && !isNaN(end)) {
      setResult(Math.abs(end - start));
    }
  };

  return (
    <div className="flex-1">
      <h1 className="text-2xl font-bold text-eecol-blue mb-4">Wire Mark Calculator</h1>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Starting Mark</label>
          <input
            type="number"
            value={startMark}
            onChange={(e) => setStartMark(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-eecol-blue outline-none"
            placeholder="e.g. 100"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ending Mark</label>
          <input
            type="number"
            value={endMark}
            onChange={(e) => setEndMark(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-eecol-blue outline-none"
            placeholder="e.g. 150"
          />
        </div>
        <button
          onClick={calculate}
          className="w-full bg-eecol-blue text-white font-bold py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Calculate Length
        </button>
        {result !== null && (
          <div className="mt-6 p-4 bg-eecol-light-blue rounded text-center">
            <p className="text-sm text-gray-600">Calculated Length:</p>
            <p className="text-3xl font-black text-eecol-blue">{result} units</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkCalculator;
