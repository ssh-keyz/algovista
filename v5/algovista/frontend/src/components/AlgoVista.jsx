"use client";

import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import Surface3DPlot from './Surface3DPlot';

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

  console.log('Solution Data:', JSON.stringify(solution, null, 2));

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

  console.log('Visualization Data:', JSON.stringify(visualizationData, null, 2));

  return (
    <div className="h-full bg-white p-4 rounded-lg">
      {/* Visualization content will be implemented based on type */}
      <div className="text-center text-gray-600">
        <Surface3DPlot data={visualizationData} />
      </div>
    </div>
  );
};

const AlgoVista = () => {
  const [loading, setLoading] = useState({ solve: false, visualize: false });
  const [error, setError] = useState(null);
  const [solution, setSolution] = useState(null);
  const [visualization, setVisualization] = useState(null);

  const handleEquationSubmit = async (formData) => {
    setError(null);
    setSolution(null);
    setVisualization(null);
    setLoading({ solve: true, visualize: false });

    try {
      // First call solve endpoint
      const solveResponse = await fetch('/api/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        keepalive: true,
        signal: AbortSignal.timeout(1800000), // 30 minute timeout
      }).catch(err => ({ ok: false, error: err }));

      // Handle solve response
      if (solveResponse.ok) {
        try {
          const reader = solveResponse.body.getReader();
          const decoder = new TextDecoder();
          let result = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += decoder.decode(value, { stream: true });
          }
          
          const solveData = JSON.parse(result);
          // if (!solveData || !Array.isArray(solveData.solution)) {
          //   throw new Error('Invalid solution data received');
          // }
          setSolution(solveData);
        } catch (err) {
          console.error('Error parsing solve data:', err);
          setError(prev => ({ 
            ...prev, 
            solve: 'Failed to process solution data' 
          }));
        }
      } else {
        console.error('Solve request failed:', solveResponse.error || 'Unknown error');
        setError(prev => ({ 
          ...prev, 
          solve: 'Failed to get solution' 
        }));
      }
      setLoading(prev => ({ ...prev, solve: false, visualize: true }));

      // Then call visualize endpoint
      const visualizeResponse = await fetch('/api/visualize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        keepalive: true,
        signal: AbortSignal.timeout(1800000), // 30 minute timeout
      }).catch(err => ({ ok: false, error: err }));

      // Handle visualize response
      if (visualizeResponse.ok) {
        try {
          const reader = visualizeResponse.body.getReader();
          const decoder = new TextDecoder();
          let result = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += decoder.decode(value, { stream: true });
          }
          
          const visualizeData = JSON.parse(result);
          // if (!visualizeData || !visualizeData.function) {
          //   throw new Error('Invalid visualization data received');
          // }
          setVisualization(visualizeData);
        } catch (err) {
          console.error('Error parsing visualization data:', err);
          setError(prev => ({ 
            ...prev, 
            visualize: 'Failed to process visualization data' 
          }));
        }
      } else {
        console.error('Visualize request failed:', visualizeResponse.error || 'Unknown error');
        setError(prev => ({ 
          ...prev, 
          visualize: 'Failed to get visualization' 
        }));
      }
      setLoading(prev => ({ ...prev, visualize: false }));

    } catch (err) {
      console.error('Error details:', err);
      setError({ general: 'Failed to process request' });
      setLoading({ solve: false, visualize: false });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Input Form */}
        <EquationInput onSubmit={handleEquationSubmit} />

        {/* Error Display */}
        {error && (
          <div className="space-y-2 mb-6">
            {error.general && (
              <Alert variant="destructive">
                <AlertDescription>{error.general}</AlertDescription>
              </Alert>
            )}
            {error.solve && (
              <Alert variant="destructive">
                <AlertDescription>{error.solve}</AlertDescription>
              </Alert>
            )}
            {error.visualize && (
              <Alert variant="destructive">
                <AlertDescription>{error.visualize}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Loading State */}
        {(loading.solve || loading.visualize) && (
          <div className="text-center py-4">
            <div className="text-gray-600">
              {loading.solve && "Processing solution..."}
              {loading.solve && loading.visualize && " and "}
              {loading.visualize && "generating visualization..."}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Solution Steps */}
          <Container>
            {!loading.solve && solution && <SolutionDisplay solution={solution} />}
          </Container>

          {/* Right Column - Visualization */}
          <Container>
            {!loading.visualize && visualization && <VisualizationDisplay visualizationData={visualization} />}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default AlgoVista;