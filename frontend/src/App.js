// import React, { useState, useEffect } from "react";
//
// import axios from "axios";
// import "./App.css";
// import 'katex/dist/katex.min.css';
// import { BlockMath } from 'react-katex';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
//
// import SolutionStep from './components/solutionStep.js';
//
// const styles = {
//   container: {
//     maxWidth: '800px',
//     margin: '0 auto',
//     padding: '20px',
//     fontFamily: 'Arial, sans-serif',
//     backgroundColor: '#1e1e1e',
//     color: '#e0e0e0',
//     minHeight: '100vh',
//   },
//   title: {
//     fontSize: '32px',
//     fontWeight: 'bold',
//     marginBottom: '20px',
//     textAlign: 'center',
//     color: '#61dafb',
//     textShadow: '0 0 10px rgba(97, 218, 251, 0.5)',
//   },
//   form: {
//     display: 'flex',
//     marginBottom: '20px',
//   },
//   input: {
//     flex: 1,
//     padding: '12px',
//     fontSize: '16px',
//     backgroundColor: '#2c2c2c',
//     border: '1px solid #444',
//     borderRadius: '4px 0 0 4px',
//     color: '#e0e0e0',
//   },
//   button: {
//     padding: '12px 24px',
//     fontSize: '16px',
//     backgroundColor: '#61dafb',
//     color: '#1e1e1e',
//     border: 'none',
//     borderRadius: '0 4px 4px 0',
//     cursor: 'pointer',
//     transition: 'background-color 0.3s',
//   },
//   finalAnswer: {
//     backgroundColor: '#2c2c2c',
//     padding: '20px',
//     borderRadius: '8px',
//     marginTop: '20px',
//     boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//   },
//   finalAnswerText: {
//     fontSize: '20px',
//     fontWeight: 'bold',
//     margin: 0,
//     marginBottom: '10px',
//     color: '#61dafb',
//   },
//   popupOverlay: {
//     position: 'fixed',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     display: 'flex',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 1000,
//   },
//   popupContent: {
//     backgroundColor: '#1e1e1e',
//     padding: '20px',
//     borderRadius: '8px',
//     maxWidth: '90%',
//     maxHeight: '90%',
//     overflow: 'auto',
//     position: 'relative',
//   },
//   closeButton: {
//     position: 'absolute',
//     top: '10px',
//     right: '10px',
//     background: 'none',
//     border: 'none',
//     color: '#61dafb',
//     fontSize: '24px',
//     cursor: 'pointer',
//   }
// };
//
// function parseResponse(response) {
//   // Helper function to clean LaTeX markers
//   const cleanLatex = (text) => {
//     return text.replace(/\$([^$]+)\$/g, '$1');
//   };
//
//   try {
//     // Handle if response is a string
//     let parsedResponse = response;
//
//     // If response is still a string, try to parse it as JSON
//     if (typeof response === 'string') {
//       // Remove XML-like tags if they exist
//       parsedResponse = response.replace(/<\/?response>/g, '').trim();
//       parsedResponse = JSON.parse(parsedResponse);
//     }
//
//     // Transform the solution steps
//     return {
//       solution: parsedResponse.solution.map(step => ({
//         step: step.step,
//         action: cleanLatex(step.action),
//         equation: step.equation,
//         explanation: step.explanation
//       })),
//       final_answer: cleanLatex(parsedResponse.final_answer)
//     };
//   } catch (error) {
//     console.error('Error parsing response:', error);
//     return null;
//   }
// }
// const CalculusSolutionDisplay = ({ solution }) => {
//   if (!solution) {
//     return <div>No solution available</div>;
//   }
//
//   return (
//     <div>
//       {solution.solution.map((item, index) => (
//         <SolutionStep
//           key={index}
//           step={item.step}
//           action={item.action}
//           equation={item.equation}
//           explanation={item.explanation}
//         />
//       ))}
//       <div style={styles.finalAnswer}>
//         <h3 style={styles.finalAnswerText}>Final Answer:</h3>
//         <BlockMath math={solution.final_answer} />
//       </div>
//     </div>
//   );
// };
// const PopupWindow = ({ isOpen, onClose, children }) => {
//   if (!isOpen) return null;
//
//   return (
//     <div style={styles.popupOverlay}>
//       <div style={styles.popupContent}>
//         <button style={styles.closeButton} onClick={onClose}>&times;</button>
//         {children}
//       </div>
//     </div>
//   );
// };
// function App() {
//   const [equation, setEquation] = useState("f(x) = x^2");
//   const [graphData, setGraphData] = useState([]);
//   const [isPopupOpen, setIsPopupOpen] = useState(false);
//
//   const [solution, setSolution] = useState({
//     solution: [
//       {
//         step: 1,
//         action: "Identify the function",
//         equation: "f(x) = x^2",
//         explanation: "The given function is $f(x) = x^2$, which is a quadratic function."
//       },
//       {
//         step: 2,
//         action: "Analyze the function",
//         equation: "f(x) = x^2",
//         explanation: "This function is a parabola that opens upward and has its vertex at the origin $(0, 0)$."
//       },
//       {
//         step: 3,
//         action: "Describe key properties",
//         equation: "\\begin{cases} f(0) = 0^2 = 0 \\\\ f(x) \\geq 0 \\text{ for all } x \\\\ f(-x) = f(x) \\text{ (even function)} \\end{cases}",
//         explanation: "The function passes through the origin, is always non-negative ($f(x) \\geq 0$), and is symmetric about the y-axis ($f(-x) = f(x)$)."
//       }
//     ],
//     final_answer: "f(x) = x^2 \\text{ is a quadratic function representing an upward-opening parabola centered at the origin.}"
//
//   });
//   const generateGraphData = (func) => {
//     const data = [];
//     for (let x = -10; x <= 10; x += 0.5) {
//       try {
//         // Use a safer way to evaluate the function
//         const y = eval(func.replace('f(x)', 'Math').replace('^', '**'));
//         data.push({ x, y });
//       } catch (error) {
//         console.error('Error evaluating function:', error);
//       }
//     }
//     return data;
//   };
//   useEffect(() => {
//     const funcString = equation.split('=')[1].trim();
//     const data = generateGraphData(funcString);
//     setGraphData(data);
//   }, [equation]);
//
//
//   const handleSolve = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post("http://localhost:3000/api/solve", {
//         equation,
//       });
//       console.log("Raw response:", response.data);
//
//       // Parse the JSON string in the response
//       // const parsedSolution = JSON.parse(response.data['solution'][0]);
//       setSolution(parseResponse(response.data));
//       setIsPopupOpen(true);
//     } catch (error) {
//       console.error("Error:", error);
//       setSolution(null);
//     }
//   };
//   const togglePopup = () => {
//     setIsPopupOpen(!isPopupOpen);
//   };
//   return (
//     <div style={styles.container}>
//       <h1 style={styles.title}>AlgoVista Math Solver</h1>
//       <form onSubmit={handleSolve} style={styles.form}>
//         <input
//           type="text"
//           value={equation}
//           onChange={(e) => setEquation(e.target.value)}
//           placeholder="Enter a math equation"
//           style={styles.input}
//         />
//         <button type="submit" style={styles.button}>Solve</button>
//       </form>
//       {solution && <CalculusSolutionDisplay solution={solution} />}
//       <PopupWindow isOpen={isPopupOpen} onClose={togglePopup}>
//         <div style={styles.graphContainer}>
//           <h2 style={styles.graphTitle}>Function Graph</h2>
//           <ResponsiveContainer width="100%" height={300}>
//             <LineChart data={graphData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#444" />
//               <XAxis dataKey="x" stroke="#e0e0e0" />
//               <YAxis stroke="#e0e0e0" />
//               <Tooltip contentStyle={{ backgroundColor: '#2c2c2c', border: '1px solid #444' }} />
//               <Line type="monotone" dataKey="y" stroke="#61dafb" dot={false} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//         {solution && <CalculusSolutionDisplay solution={solution} />}
//       </PopupWindow>
//     </div>
//   );
// }
//
//
// export default App;

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BlockMath } from 'react-katex';
import axios from 'axios';
import 'katex/dist/katex.min.css';

const MathSolver = () => {
  const [equation, setEquation] = useState("f(x) = x^2");
  const [graphData, setGraphData] = useState([]);
  const [error, setError] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [solution, setSolution] = useState(null);

  const parseEquation = (eqString) => {
    try {
      // Handle empty or invalid input
      if (!eqString || typeof eqString !== 'string') {
        throw new Error('Invalid equation format');
      }

      // Check if equation contains '='
      const parts = eqString.split('=');
      if (parts.length !== 2) {
        throw new Error('Equation must contain exactly one equals sign');
      }

      const rightSide = parts[1].trim();
      // Return the parsed expression
      return rightSide
          .replace(/\^/g, '**')  // Convert ^ to **
          .replace(/x/g, 'x')    // Ensure x is lowercase
          .replace(/\s/g, '');   // Remove spaces
    } catch (err) {
      throw new Error('Could not parse equation: ' + err.message);
    }
  };

  const generateGraphData = (functionString) => {
    try {
      const parsedFunc = parseEquation(functionString);
      const data = [];

      for (let x = -10; x <= 10; x += 0.5) {
        try {
          // Safely evaluate the function using Function constructor
          const safeFunction = new Function('x', `return ${parsedFunc}`);
          const y = safeFunction(x);

          // Only add valid numerical results
          if (!isNaN(y) && isFinite(y)) {
            data.push({ x, y });
          }
        } catch (error) {
          console.warn(`Skip point at x=${x}: ${error.message}`);
        }
      }

      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    }
  };

  useEffect(() => {
    try {
      const data = generateGraphData(equation);
      setGraphData(data);
    } catch (err) {
      setError(err.message);
      setGraphData([]);
    }
  }, [equation]);

  const handleSolve = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post("http://localhost:3000/api/solve", {
        equation,
      });

      if (response.data) {
        setSolution(parseResponse(response.data));
        setIsPopupOpen(true);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err.message);
      setSolution(null);
    }
  };

  return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-gray-900 min-h-screen text-gray-100">
        <h1 className="text-4xl font-bold mb-6 text-center text-cyan-400">
          AlgoVista Math Solver
        </h1>

        {error && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
        )}

        <form onSubmit={handleSolve} className="flex gap-2 mb-6">
          <input
              type="text"
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              placeholder="Enter equation (e.g. f(x) = x^2)"
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg text-gray-100"
          />
          <button
              type="submit"
              className="px-6 py-2 bg-cyan-500 text-gray-900 rounded-r-lg hover:bg-cyan-400 transition-colors"
          >
            Solve
          </button>
        </form>

        <div className="mb-6 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">Function Graph</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="x" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#9CA3AF' }}
              />
              <Line type="monotone" dataKey="y" stroke="#06B6D4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {solution && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-cyan-400">Solution</h2>
              {solution.solution.map((step, index) => (
                  <div key={index} className="mb-4 p-4 bg-gray-900 rounded-lg">
                    <h3 className="font-medium text-cyan-400">Step {step.step}: {step.action}</h3>
                    <BlockMath math={step.equation} />
                    <p className="mt-2 text-gray-300">{step.explanation}</p>
                  </div>
              ))}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <h3 className="font-semibold text-cyan-400">Final Answer:</h3>
                <BlockMath math={solution.final_answer} />
              </div>
            </div>
        )}
      </div>
  );
};

export default MathSolver;
