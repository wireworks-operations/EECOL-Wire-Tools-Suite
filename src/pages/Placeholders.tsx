import React from 'react';

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold text-eecol-blue mb-4">{title}</h1>
    <p className="text-gray-600">This module is currently being refactored to React. Please check back soon!</p>
    <div className="mt-8 text-6xl opacity-20">🚧</div>
  </div>
);

export const StopMark: React.FC = () => <PlaceholderPage title="Stop Mark Calculator" />;
export const ReelCapacity: React.FC = () => <PlaceholderPage title="Reel Capacity Estimator" />;
export const ReelSize: React.FC = () => <PlaceholderPage title="Reel Size Estimator" />;
export const ShippingManifest: React.FC = () => <PlaceholderPage title="Shipping Manifest" />;
export const ReelLabels: React.FC = () => <PlaceholderPage title="Reel Inventory Labels" />;
export const Maintenance: React.FC = () => <PlaceholderPage title="Machine Maintenance" />;
export const AdvancedMath: React.FC = () => <PlaceholderPage title="Advanced Mathematics" />;
export const Education: React.FC = () => <PlaceholderPage title="Education Center" />;
export const About: React.FC = () => <PlaceholderPage title="About & Feedback" />;
