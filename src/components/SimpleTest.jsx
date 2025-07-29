import React from 'react';

export default function SimpleTest() {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-500 text-white p-4 rounded shadow">
      <h3>🧪 Simple Test Component</h3>
      <p>Development mode: {process.env.NODE_ENV}</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
} 