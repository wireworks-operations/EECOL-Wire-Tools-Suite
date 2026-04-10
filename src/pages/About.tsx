import React from 'react';

const About: React.FC = () => (
  <div className="flex-1 flex flex-col items-center p-4 animate-entrance pb-24 text-left">
    <div className="w-full max-w-4xl bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/20">
      <h1 className="text-3xl font-black header-gradient text-center mb-6 uppercase">About & Feedback</h1>

      <div className="space-y-6">
        <section className="bg-eecol-light-blue dark:bg-blue-900/20 p-6 rounded-xl border-l-4 border-eecol-blue">
          <h2 className="text-xl font-bold text-eecol-blue dark:text-blue-300 mb-2">The Mission</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            The EECOL Wire Tools Suite is designed to bring industrial precision to wire processing.
            By eliminating manual calculation errors and optimizing reeling operations, we ensure
            maximum efficiency and minimal waste.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-l-4 border-green-500">
            <h3 className="font-bold text-green-800 dark:text-green-400 mb-1">Feedback</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Values your thoughts on improvements.</p>
            <p className="text-sm font-bold mt-2">lucas.kara@eecol.com</p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-l-4 border-purple-500">
            <h3 className="font-bold text-purple-800 dark:text-purple-400 mb-1">Architecture</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Local-first, PWA technology.</p>
            <p className="text-sm font-bold mt-2 italic">Refactored to React/TS v0.9.0</p>
          </div>
        </div>

        <section className="bg-gray-50 dark:bg-slate-700 p-6 rounded-xl">
           <h2 className="text-lg font-bold header-gradient mb-4 uppercase">Core Objectives</h2>
           <ul className="text-xs space-y-3">
              <li>• <strong>Precision:</strong> High-precision math for stop-point calculation.</li>
              <li>• <strong>Efficiency:</strong> Reducing back-reeling and setup time.</li>
              <li>• <strong>Organization:</strong> Standardized logging and inventory tracking.</li>
           </ul>
        </section>
      </div>
    </div>
  </div>
);

export default About;
