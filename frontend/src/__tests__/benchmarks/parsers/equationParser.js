// frontend/src/__tests__/benchmarks/parsers/equationParser.js
import React, { useMemo } from 'react';
import { InlineMath } from 'react-katex';

/**
 * Original implementation of the equation parser
 * This version doesn't include any optimizations
 */
export const originalRenderExplanation = (text) => {
  const parts = text.split(/(\$.*?\$)/);
  return parts.map((part, index) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      return <InlineMath key={index} math={part.slice(1, -1)} />;
    }
    return part;
  });
};

/**
 * Optimized implementation of the equation parser
 * Includes performance improvements:
 * - Memoization of parsed components
 * - Pre-compiled regex
 * - Efficient string manipulation
 * - Better key generation for React elements
 */
const LATEX_PATTERN = /(\$.*?\$)/;
const mathCache = new Map();

export const optimizedRenderExplanation = (text) => {
  // Key generation for stable React rendering
  const generateKey = (content, index) => {
    return `math-${Buffer.from(content).toString('base64')}-${index}`;
  };

  // Check cache first
  const cachedResult = mathCache.get(text);
  if (cachedResult) {
    return cachedResult;
  }

  // Parse the text
  const parts = text.split(LATEX_PATTERN);
  const result = parts.map((part, index) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const mathContent = part.slice(1, -1);
      const key = generateKey(mathContent, index);
      
      // Create memoized math component
      return useMemo(
        () => <InlineMath key={key} math={mathContent} />,
        [mathContent]
      );
    }
    return part;
  });

  // Cache the result
  mathCache.set(text, result);
  
  return result;
};

/**
 * Parser for specific equation types
 */
export const equationTypeParser = {
  // Linear equation parser (ax + b)
  linear: (equation) => {
    const linearRegex = /f\(x\)\s*=\s*([-+]?\d*\.?\d*)x\s*([-+]\s*\d*\.?\d*)?/;
    const match = equation.match(linearRegex);
    
    if (match) {
      const slope = parseFloat(match[1] || '1');
      const intercept = parseFloat(match[2]?.replace(/\s/g, '') || '0');
      
      return {
        type: 'linear',
        coefficients: {
          slope,
          intercept
        },
        latex: `f(x) = ${slope}x ${intercept >= 0 ? '+' : ''} ${intercept}`
      };
    }
    return null;
  },

  // Quadratic equation parser (ax² + bx + c)
  quadratic: (equation) => {
    const quadraticRegex = /f\(x\)\s*=\s*([-+]?\d*\.?\d*)x²\s*([-+]\d*\.?\d*x)?\s*([-+]\d*\.?\d*)?/;
    const match = equation.match(quadraticRegex);
    
    if (match) {
      const a = parseFloat(match[1] || '1');
      const b = parseFloat(match[2]?.replace('x', '') || '0');
      const c = parseFloat(match[3] || '0');
      
      return {
        type: 'quadratic',
        coefficients: { a, b, c },
        latex: `f(x) = ${a}x^2 ${b >= 0 ? '+' : ''} ${b}x ${c >= 0 ? '+' : ''} ${c}`
      };
    }
    return null;
  },

  // Trigonometric equation parser
  trigonometric: (equation) => {
    const trigRegex = /f\(x\)\s*=\s*(sin|cos|tan)\((.*?)\)/;
    const match = equation.match(trigRegex);
    
    if (match) {
      const func = match[1];
      const argument = match[2];
      
      return {
        type: 'trigonometric',
        function: func,
        argument: argument,
        latex: `f(x) = \\${func}(${argument})`
      };
    }
    return null;
  }
};

/**
 * Utility function to determine equation type and parse accordingly
 */
export const parseEquation = (equation) => {
  // Try each parser in sequence
  const parsers = [
    equationTypeParser.linear,
    equationTypeParser.quadratic,
    equationTypeParser.trigonometric
  ];

  for (const parser of parsers) {
    const result = parser(equation);
    if (result) return result;
  }

  // If no specific parser matches, return a generic result
  return {
    type: 'unknown',
    original: equation,
    latex: equation
  };
};

export default {
  originalRenderExplanation,
  optimizedRenderExplanation,
  equationTypeParser,
  parseEquation
};
