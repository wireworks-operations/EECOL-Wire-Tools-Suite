import React, { useState } from 'react';

const WeightCalculator: React.FC = () => {
  const [length, setLength] = useState<string>('');
  const [factor, setFactor] = useState<string>('0.5');
  const [weight, setWeight] = useState<number | null>(null);

  const calculate = () => {
    const l = parseFloat(length);
    const f = parseFloat(factor);
    if (!isNaN(l) && !isNaN(f)) {
      setWeight(l * f);
    }
  };

  return (
    <div className="flex-1">
      <h1 className="text-2xl font-bold text-eecol-blue mb-4">Wire Weight Estimator</h1>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
          <input
            type="number"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-eecol-blue outline-none"
            placeholder="e.g. 100"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight Factor (kg/unit)</label>
          <input
            type="number"
            value={factor}
            onChange={(e) => setFactor(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-eecol-blue outline-none"
          />
        </div>
        <button
          onClick={calculate}
          className="w-full bg-eecol-blue text-white font-bold py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Estimate Weight
        </button>
        {weight !== null && (
          <div className="mt-6 p-4 bg-eecol-light-blue rounded text-center">
            <p className="text-sm text-gray-600">Estimated Weight:</p>
            <p className="text-3xl font-black text-eecol-blue">{weight.toFixed(2)} kg</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeightCalculator;
