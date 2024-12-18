import React, { useState, useEffect } from "react";

import axios from "axios";
import "./App.css";
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './styles/App.styles';

import SolutionStep from './components/solutionStep.js';
// import { runPerformanceComparison } from './__tests__/benchmarks/runBenchmarks.js';
import { Cache } from './services/cache';
// import { Benchmark } from './__tests__/benchmarks/Benchmark.js';

function parseResponse(response) {
  // Helper function to clean LaTeX markers
  const cleanLatex = (text) => {
    return text.replace(/\$([^$]+)\$/g, '$1');
  };

  try {
    // Handle if response is a string
    let parsedResponse = response;

    // If response is still a string, try to parse it as JSON
    if (typeof response === 'string') {
      // Remove XML-like tags if they exist
      parsedResponse = response.replace(/<\/?response>/g, '').trim();
      parsedResponse = JSON.parse(parsedResponse);
    }

    // Transform the solution steps
    return {
      solution: parsedResponse.solution.map(step => ({
        step: step.step,
        action: cleanLatex(step.action),
        equation: step.equation,
        explanation: step.explanation
      })),
      final_answer: cleanLatex(parsedResponse.final_answer)
    };
  } catch (error) {
    console.error('Error parsing response:', error);
    return null;
  }
}
const CalculusSolutionDisplay = ({ solution }) => {
  if (!solution) {
    return <div>No solution available</div>;
  }

  return (
    <div>
      {solution.solution.map((item, index) => (
        <SolutionStep
          key={index}
          step={item.step}
          action={item.action}
          equation={item.equation}
          explanation={item.explanation}
        />
      ))}
      <div style={styles.finalAnswer}>
        <h3 style={styles.finalAnswerText}>Final Answer:</h3>
        <BlockMath math={solution.final_answer} />
      </div>
    </div>
  );
};
const PopupWindow = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.popupOverlay}>
      <div style={styles.popupContent}>
        <button style={styles.closeButton} onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};
function App() {
  const [equation, setEquation] = useState("f(x) = x^2");
  const [graphData, setGraphData] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [solution, setSolution] = useState({
    solution: [
      {
        step: 1,
        action: "Identify the function",
        equation: "f(x) = x^2",
        explanation: "The given function is $f(x) = x^2$, which is a quadratic function."
      },
      {
        step: 2,
        action: "Analyze the function",
        equation: "f(x) = x^2",
        explanation: "This function is a parabola that opens upward and has its vertex at the origin $(0, 0)$."
      },
      {
        step: 3,
        action: "Describe key properties",
        equation: "\\begin{cases} f(0) = 0^2 = 0 \\\\ f(x) \\geq 0 \\text{ for all } x \\\\ f(-x) = f(x) \\text{ (even function)} \\end{cases}",
        explanation: "The function passes through the origin, is always non-negative ($f(x) \\geq 0$), and is symmetric about the y-axis ($f(-x) = f(x)$)."
      }
    ],
    final_answer: "f(x) = x^2 \\text{ is a quadratic function representing an upward-opening parabola centered at the origin.}"

  });
  const [cache] = useState(() => new Cache({
    ttl: 1800000, // 30 minutes
    maxSize: 500,
    persistToStorage: true,
    prefix: 'math_'
  }));

  const generateGraphData = (func) => {
    const data = [];
    for (let x = -10; x <= 10; x += 0.5) {
      try {
        // Use a safer way to evaluate the function
        const y = eval(func.replace('f(x)', 'Math').replace('^', '**'));
        data.push({ x, y });
      } catch (error) {
        console.error('Error evaluating function:', error);
      }
    }
    return data;
  };
  useEffect(() => {
    let funcString = '';
    try {
      funcString = equation.split('=')[1].trim();
    } catch (error) {
      console.error('Error parsing equation:', error);
      funcString = 'x'; // Default to simple linear function
    }
    const data = generateGraphData(funcString);
    setGraphData(data);
  }, [equation]);


  const handleSolve = async (e) => {
    e.preventDefault();
    try {
      // Check cache first
      const cachedSolution = await cache.get(equation);
      if (cachedSolution) {
        setSolution(cachedSolution);
        setIsPopupOpen(true);
        return;
      }

      const response = await axios.post("http://localhost:3000/api/solve", {
        equation,
      });
      console.log("Raw response:", response.data);

      const parsedSolution = parseResponse(response.data);
      setSolution(parsedSolution);
      
      // Store in cache
      await cache.set(equation, parsedSolution);
      
      setIsPopupOpen(true);
    } catch (error) {
      console.error("Error:", error);
      setSolution(null);
    }
  };
  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  // const runBenchmarkWithCache = async () => {
  //   const benchmark = new Benchmark();
  //   const testEquation = equation;

  //   console.log('Running benchmark with cache...');
  //   const result = await benchmark.runBenchmarkSuite({
  //     equation: testEquation,
  //     cache
  //   });

  //   console.log('Benchmark results:', result);
  //   console.log('Cache statistics:', cache.getStats());
  // };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>AlgoVista Math Solver</h1>
      <form onSubmit={handleSolve} style={styles.form}>
        <input
          type="text"
          value={equation}
          onChange={(e) => setEquation(e.target.value)}
          placeholder="Enter a math equation"
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Solve</button>
      </form>
      {solution && <CalculusSolutionDisplay solution={solution} />}
      <PopupWindow isOpen={isPopupOpen} onClose={togglePopup}>
        <div style={styles.graphContainer}>
          <h2 style={styles.graphTitle}>Function Graph</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="x" stroke="#e0e0e0" />
              <YAxis stroke="#e0e0e0" />
              <Tooltip contentStyle={{ backgroundColor: '#2c2c2c', border: '1px solid #444' }} />
              <Line type="monotone" dataKey="y" stroke="#61dafb" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {solution && <CalculusSolutionDisplay solution={solution} />}
      </PopupWindow>
      {/* <button onClick={runBenchmarkWithCache}>Run Performance Comparison</button> */}
    </div>
  );
}


export default App;
