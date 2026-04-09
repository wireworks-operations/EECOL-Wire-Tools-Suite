import React from 'react';
import { Link } from 'react-router-dom';

interface ToolCardProps {
  to: string;
  icon: string;
  title: string;
  description: string;
  large?: boolean;
  disabled?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({ to, icon, title, description, large, disabled }) => (
  <Link
    to={disabled ? '#' : to}
    className={`bg-white p-6 rounded-lg shadow-md border-l-4 border-eecol-blue text-center block no-underline transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:translate-y-[-4px] hover:shadow-xl'} ${large ? 'col-span-2 md:col-span-3' : 'col-span-2'}`}
  >
    <div className={`${large ? 'text-6xl' : 'text-3xl'} mb-2`}>{icon}</div>
    <h3 className={`${large ? 'text-xl' : 'text-lg'} font-bold text-eecol-blue`}>{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </Link>
);

const Home: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex justify-center mb-1 relative">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-eecol-blue drop-shadow-lg">
          <circle cx="12" cy="12" r="11.35" fill="white" stroke="currentColor" stroke-width="2" />
          <rect x="4" y="4" width="4" height="16" rx="1" fill="currentColor" />
          <path d="M 8,6.5 C 12,5.5 16,7.5 20,6.5" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
          <path d="M 8,12 C 12,11 16,13 20,12" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
          <path d="M 8,17.5 C 12,16.5 16,18.5 20,17.5" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
        </svg>
      </div>

      <h1 className="text-3xl font-black mb-3 text-center header-gradient">
        EECOL Wire Tools Suite
      </h1>
      <p className="mb-4 text-center text-sm font-medium text-eecol-blue">
        Choose Your Tool - Wire Cut Consistency Protocol
      </p>

      <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-eecol-blue mb-6">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-3">🔧</div>
          <h2 className="text-xl font-bold text-eecol-blue">EECOL Wire Tools Suite Overview</h2>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          The EECOL Wire Tools Suite provides a comprehensive collection of specialized calculators,
          estimators, and record-keeping tools.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
        <ToolCard to="/cutting-records" icon="📊" title="Wire Cut Records" description="Log, track, and analyze wire cuts." large />
        <ToolCard to="/inventory-records" icon="📦" title="Wire Inventory Records" description="Track and manage wire inventory." large />
        <ToolCard to="/reports" icon="📈" title="Reports" description="Statistical analysis and trends." />
        <ToolCard to="/mark-calculator" icon="📏" title="Mark Calculator" description="Calculate length between wire marks." />
        <ToolCard to="/weight" icon="⚖️" title="Weight Calculator" description="Estimate wire weight by length." />
        <ToolCard to="#" icon="⏹️" title="Stop Mark Calculator" description="Determine exact stopping points." disabled />
      </div>
    </div>
  );
};

export default Home;
