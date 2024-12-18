"use client";

import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const VISUALIZATION_TYPES = {
  MULTIVARIABLE: 'Multivariable Functions and Gradient Fields',
  COMPLEX: 'Complex Integration and Residue Theory',
  DIFFERENTIAL: 'Differential Geometry (Manifolds)',
  CONVERGENCE: 'Convergence of Series and Sequences',
  VECTOR_FIELDS: 'Vector Fields and Flow Lines'
};

const Container = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
    {children}
  </div>
);

const EquationInput = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    visualization_type: VISUALIZATION_TYPES.MULTIVARIABLE,
    equation: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Container className="mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Visualization Type</label>
          <select 
            name="visualization_type"
            value={formData.visualization_type}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white"
          >
            {Object.values(VISUALIZATION_TYPES).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Enter Equation</label>
          <input
            type="text"
            name="equation"
            value={formData.equation}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            placeholder="Enter your equation"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Analyze
        </button>
      </form>
    </Container>
  );
};

const SolutionStep = ({ step, action, equation, explanation }) => {
  const renderLatex = (text) => {
    if (!text) return '';
    const parts = text.split(/(\$.*?\$)/);
    return parts.map((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        return <InlineMath key={index} math={part.slice(1, -1)} />;
      }
      return part;
    });
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Step {step}: {action}</h3>
      <div className="mb-2">
        <BlockMath math={equation} />
      </div>
      <p className="text-gray-700">{renderLatex(explanation)}</p>
    </div>
  );
};

const SolutionDisplay = ({ solution }) => {
  if (!solution) return null;

  return (
    <div className="space-y-4">
      {solution.solution.map((step, index) => (
        <SolutionStep key={index} {...step} />
      ))}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm">
        <h3 className="font-medium text-lg mb-2">Final Answer</h3>
        <BlockMath math={solution.final_answer} />
      </div>
    </div>
  );
};

const VisualizationDisplay = ({ visualizationData }) => {
  if (!visualizationData) return null;

  return (
    <div className="h-full bg-white p-4 rounded-lg">
      {/* Visualization content will be implemented based on type */}
      <div className="text-center text-gray-600">
        Visualization component will be rendered here
      </div>
    </div>
  );
};

const AlgoVista = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [solution, setSolution] = useState(null);
  const [visualization, setVisualization] = useState(null);

  const handleEquationSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      // Make parallel API calls for solve and visualize
      const [solveResponse, visualizeResponse] = await Promise.all([
        fetch('/api/solve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }),
        fetch('/api/visualize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }),
      ]);

      const [solveData, visualizeData] = await Promise.all([
        solveResponse.json(),
        visualizeResponse.json(),
      ]);

      if (!solveResponse.ok || !visualizeResponse.ok) {
        throw new Error('Failed to process equation');
      }

      setSolution(solveData);
      setVisualization(visualizeData);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Input Form */}
        <EquationInput onSubmit={handleEquationSubmit} />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-4">
            <div className="text-gray-600">Processing your equation...</div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Solution Steps */}
          <Container>
            <SolutionDisplay solution={solution} />
          </Container>

          {/* Right Column - Visualization */}
          <Container>
            <VisualizationDisplay visualizationData={visualization} />
          </Container>
        </div>
      </div>
    </div>
  );
};

export default AlgoVista;