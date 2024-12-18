"use client";

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Surface3DPlot = ({ data }) => {
  const [plotData, setPlotData] = useState([]);
  const [rotation, setRotation] = useState({ x: 45, y: 45, z: 0 });

  useEffect(() => {
    if (!data || !data.visualization_config) return;

    const { ranges, resolution } = data.visualization_config;
    const points = generateSurfacePoints(data.equation, ranges, resolution);
    setPlotData(points);
  }, [data]);

  const generateSurfacePoints = (equation, ranges, resolution) => {
    const points = [];
    const { x: xRange, y: yRange } = ranges;
    const { x: xRes, y: yRes } = resolution;

    const dx = (xRange[1] - xRange[0]) / xRes;
    const dy = (yRange[1] - yRange[0]) / yRes;

    for (let i = 0; i < xRes; i++) {
      const row = [];
      const x = xRange[0] + i * dx;
      
      for (let j = 0; j < yRes; j++) {
        const y = yRange[0] + j * dy;
        // Evaluate the equation - this is a simplified example
        // In practice, you'd need to safely evaluate the mathematical expression
        const z = evaluateEquation(equation, x, y);
        row.push({ x, y, z });
      }
      points.push(row);
    }

    return points;
  };

  const evaluateEquation = (equation, x, y) => {
    try {
      // This is a placeholder - you'll need to implement proper equation evaluation
      // Consider using math.js or a similar library for safe evaluation
      return x * x + y * y; // Example for z = x² + y²
    } catch (error) {
      console.error('Error evaluating equation:', error);
      return 0;
    }
  };

  const handleRotationChange = (axis, value) => {
    setRotation(prev => ({
      ...prev,
      [axis]: value
    }));
  };

  const transformPoint = (point) => {
    // Apply 3D rotation transformations
    // This is a simplified transformation - you'll need proper 3D matrix transformations
    const { x, y, z } = point;
    const radX = (rotation.x * Math.PI) / 180;
    const radY = (rotation.y * Math.PI) / 180;
    
    // Basic rotation around X and Y axes
    const rotX = {
      x: x,
      y: y * Math.cos(radX) - z * Math.sin(radX),
      z: y * Math.sin(radX) + z * Math.cos(radX)
    };
    
    const rotXY = {
      x: rotX.x * Math.cos(radY) + rotX.z * Math.sin(radY),
      y: rotX.y,
      z: -rotX.x * Math.sin(radY) + rotX.z * Math.cos(radY)
    };

    return rotXY;
  };

  return (
    <div className="w-full max-w-4xl p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">3D Surface Plot</h2>
        
        {/* Rotation Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">X Rotation:</label>
            <input
              type="range"
              min="0"
              max="360"
              value={rotation.x}
              onChange={(e) => handleRotationChange('x', parseInt(e.target.value))}
              className="w-48"
            />
            <span className="text-sm">{rotation.x}°</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Y Rotation:</label>
            <input
              type="range"
              min="0"
              max="360"
              value={rotation.y}
              onChange={(e) => handleRotationChange('y', parseInt(e.target.value))}
              className="w-48"
            />
            <span className="text-sm">{rotation.y}°</span>
          </div>
        </div>

        {/* 3D Plot Viewport */}
        <div className="h-96 w-full bg-gray-50 rounded border border-gray-200">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              {plotData.map((row, i) => (
                <Line
                  key={i}
                  type="monotone"
                  data={row.map(point => transformPoint(point))}
                  dataKey="z"
                  stroke="#8884d8"
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
              <CartesianGrid />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Critical Points */}
        {data?.mathematical_properties?.critical_points && (
          <div className="mt-4">
            <h3 className="font-medium text-lg mb-2">Critical Points</h3>
            <ul className="list-disc pl-5">
              {data.mathematical_properties.critical_points.map((point, index) => (
                <li key={index}>
                  ({point.x}, {point.y}, {point.z}) - {point.type}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Surface3DPlot;