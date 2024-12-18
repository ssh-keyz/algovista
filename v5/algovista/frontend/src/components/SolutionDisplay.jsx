"use client";

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const SolutionStep = ({ step, action, equation, explanation }) => {
  const renderLatexContent = (text) => {
    if (!text) return '';
    
    const parts = text.split(/(\$.*?\$)/);
    return parts.map((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        return <InlineMath key={index} math={part.slice(1, -1)} />;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden bg-white">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium">
          Step {step}: {action}
        </h3>
      </div>
      
      <div className="p-4">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Equation:</h4>
          <div className="p-3 bg-gray-50 rounded">
            <BlockMath math={equation} />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Explanation:</h4>
          <div className="text-gray-600">
            {renderLatexContent(explanation)}
          </div>
        </div>
      </div>
    </div>
  );
};

const FinalAnswer = ({ answer }) => {
  const renderLatexContent = (text) => {
    if (!text) return '';
    
    const parts = text.split(/(\$.*?\$)/);
    return parts.map((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        return <InlineMath key={index} math={part.slice(1, -1)} />;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-blue-50">
      <div className="bg-blue-100 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-blue-800">Final Answer</h3>
      </div>
      <div className="p-4">
        <div className="text-blue-900">
          {renderLatexContent(answer)}
        </div>
      </div>
    </div>
  );
};

const SolutionDisplay = ({ solution, final_answer }) => {
  if (!solution || !final_answer) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Solution Process</h2>
      
      <div className="space-y-6">
        {solution.map((step) => (
          <SolutionStep
            key={step.step}
            step={step.step}
            action={step.action}
            equation={step.equation.replace(/\$/g, '')} // Remove $ signs for BlockMath
            explanation={step.explanation}
          />
        ))}
        
        <FinalAnswer answer={final_answer} />
      </div>
    </div>
  );
};

export default SolutionDisplay;