/**
 * SolutionDisplay.jsx
 * 
 * A React component suite for rendering LLM-generated mathematical solutions.
 * Specifically designed to handle the output format of mathematical LLMs (like Qwen),
 * this component transforms structured solution data into an interactive, step-by-step
 * visualization with LaTeX support.
 * 
 * Expected LLM Response Schema:
 * {
 *   solution: [{
 *     step: number,          // Step number in sequence
 *     action: string,        // Description of mathematical operation
 *     equation: string,      // LaTeX formatted equation
 *     explanation: string    // Explanation with embedded LaTeX between $ symbols
 *   }],
 *   final_answer: string (with embedded LaTeX between $ symbols)
 * }
 * 
 * LaTeX Handling:
 * - Inline LaTeX: Delimited by $ symbols (e.g., $x^2$)
 * - Block LaTeX: Used for primary equations
 * - Automatic LaTeX sanitization
 * - Fallback handling for invalid LaTeX
 * 
 */

"use client";

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

/**
 * SolutionStep Component
 * 
 * Renders a single step in the mathematical solution process.
 * Handles the presentation of equations and explanations, including mixed
 * text and LaTeX content common in LLM outputs.
 * 
 * @param {Object} props
 * @param {number} props.step - Step number in the solution sequence
 * @param {string} props.action - Description of the mathematical operation being performed
 * @param {string} props.equation - LaTeX equation for this step
 * @param {string} props.explanation - Explanation text, may contain inline LaTeX between $ symbols
 */
const SolutionStep = ({ step, action, equation, explanation }) => {
  /**
   * Parses mixed text and LaTeX content from LLM responses
   * Converts $...$ delimited LaTeX into rendered mathematics
   * 
   * @param {string} text - Raw text containing potential LaTeX between $ symbols
   * @returns {Array} Array of React elements with rendered LaTeX
   */
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

/**
 * FinalAnswer Component
 * 
 * Displays the final result of the mathematical solution.
 * Visually distinct from solution steps to emphasize the conclusion.
 * 
 * @param {Object} props
 * @param {string} props.answer - The final answer text, may contain LaTeX between $ symbols
 */
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

/**
 * SolutionDisplay Component
 * 
 * Main component for rendering complete mathematical solutions from LLM output.
 * Orchestrates the display of multiple solution steps and the final answer.
 * 
 * @param {Object} props
 * @param {Array} props.solution - Array of solution steps from LLM
 * @param {string} props.final_answer - Final answer text from LLM
 * 
 * Integration Notes:
 * - Expects structured output from mathematical LLMs
 * - Handles LaTeX formatting automatically
 * - Provides clear visual progression of solution steps
 * - Null-safe rendering for incomplete or invalid solutions
 * 
 * Example Usage:
 * ```jsx
 * <SolutionDisplay 
 *   solution={[
 *     { step: 1, action: "Factor", equation: "x^2 + 5x + 6", explanation: "First, we factor..." }
 *   ]}
 *   final_answer="The solution is $x = -2$ or $x = -3$"
 * />
 * ```
 */
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