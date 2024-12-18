"use client";

import React, { useState } from 'react';

const VISUALIZATION_TYPES = {
  MULTIVARIABLE: 'Multivariable Functions and Gradient Fields',
  COMPLEX: 'Complex Integration and Residue Theory',
  DIFFERENTIAL: 'Differential Geometry (Manifolds)',
  CONVERGENCE: 'Convergence of Series and Sequences',
  VECTOR_FIELDS: 'Vector Fields and Flow Lines'
};

const INPUT_TEMPLATES = {
  [VISUALIZATION_TYPES.MULTIVARIABLE]: {
    placeholder: 'e.g., z = x^2 + y^2',
    helper: 'Enter a multivariable function in the form z = f(x,y)'
  },
  [VISUALIZATION_TYPES.COMPLEX]: {
    placeholder: 'e.g., f(z) = 1/(z^2 + 1)',
    helper: 'Enter a complex function'
  },
  [VISUALIZATION_TYPES.DIFFERENTIAL]: {
    placeholder: 'e.g., x(u,v) = cos(u)sin(v), y(u,v) = sin(u)sin(v), z(u,v) = cos(v)',
    helper: 'Enter parametric equations for the surface'
  },
  [VISUALIZATION_TYPES.CONVERGENCE]: {
    placeholder: 'e.g., a_n = 1/n^2',
    helper: 'Enter a sequence or series expression'
  },
  [VISUALIZATION_TYPES.VECTOR_FIELDS]: {
    placeholder: 'e.g., F(x,y) = [-y, x]',
    helper: 'Enter vector field components'
  }
};

const EquationForm = ({ onSubmit }) => {
  const [formState, setFormState] = useState({
    visualization_type: VISUALIZATION_TYPES.MULTIVARIABLE,
    equation: '',
    error: ''
  });

  const validateInput = () => {
    if (!formState.equation.trim()) {
      return 'Please enter an equation';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateInput();
    
    if (error) {
      setFormState(prev => ({ ...prev, error }));
      return;
    }

    try {
      await onSubmit({
        visualization_type: formState.visualization_type,
        equation: formState.equation
      });
      
      // Clear error if successful
      setFormState(prev => ({ ...prev, error: '' }));
    } catch (err) {
      setFormState(prev => ({ 
        ...prev, 
        error: err.message || 'An error occurred while processing your equation'
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value,
      error: '' // Clear error on input change
    }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Mathematical Visualization</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visualization Type
          </label>
          <select
            name="visualization_type"
            value={formState.visualization_type}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.values(VISUALIZATION_TYPES).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Equation
          </label>
          <input
            type="text"
            name="equation"
            value={formState.equation}
            onChange={handleInputChange}
            placeholder={INPUT_TEMPLATES[formState.visualization_type].placeholder}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            {INPUT_TEMPLATES[formState.visualization_type].helper}
          </p>
        </div>

        {formState.error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md">
            {formState.error}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Visualize
        </button>
      </form>
    </div>
  );
};

export default EquationForm;