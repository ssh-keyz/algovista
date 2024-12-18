"use client";

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const SolutionStep = ({ step, action, equation, explanation }) => {
  const styles = {
    stepContainer: {
      border: '1px solid #444',
      borderRadius: '10px',
      marginBottom: '20px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      backgroundColor: '#2c2c2c',
    },
    stepHeader: {
      background: 'linear-gradient(to right, #2c2c2c, #3c3c3c)',
      padding: '13px 17px',
      borderBottom: '1px solid #444',
    },
    stepTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      margin: 0,
      color: '#61dafb',
    },
    stepContent: {
      padding: '15px',
    },
    label: {
      fontWeight: 'bold',
      color: '#61dafb',
      marginBottom: '5px',
    },
    text: {
      color: '#e0e0e0',
      lineHeight: '1.5',
    },
  };

  const renderExplanation = (text) => {
    const parts = text ? text.split(/(\$.*?\$)/) : [''];
    return parts.map((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        return <InlineMath key={index} math={part.slice(1, -1)} />;
      }
      return part;
    });
  };

  return (
    <div style={styles.stepContainer}>
      <div style={styles.stepHeader}>
        <h2 style={styles.stepTitle}>Step {step}: {action}</h2>
      </div>
      <div style={styles.stepContent}>
        <div style={styles.label}>Equation:</div>
        <BlockMath math={equation} />
        <div style={styles.label}>Explanation:</div>
        <div style={styles.text}>{renderExplanation(explanation)}</div>
      </div>
    </div>
  );
};

export default SolutionStep;