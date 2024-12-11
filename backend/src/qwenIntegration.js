require('dotenv').config();
const axios = require('axios');
const NodeCache = require('node-cache');

// Cache configuration
const equationCache = new NodeCache({
  stdTTL: 86400, // 24 hour cache
  checkperiod: 3600, // Cleanup every hour
  maxKeys: 1000 // Prevent unlimited growth
});

// Constants
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 2;
const API_URL = process.env.QWEN_API_URL;

// Standardize equation to use as cache key
function standardizeEquation(equation) {
  return equation.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Retry mechanism with exponential backoff
async function retryWithBackoff(operation, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function processEquationWithQWEN(equation) {
  const cacheKey = standardizeEquation(equation);
  console.log(`Processing equation: ${equation}`);

  // Check cache first
  const cachedResult = equationCache.get(cacheKey);
  if (cachedResult) {
    console.log('Cache hit for equation');
    return cachedResult;
  }

  try {
    const response = await retryWithBackoff(async () => {
      return axios.post(API_URL, {
        messages: [
          { role: "user", content: `You are the world's greatest calculus tutor, known for your clear and detailed step-by-step solutions. Your task is to solve calculus problems with precision and clarity. Follow these instructions:

1. Analyze the given calculus problem carefully.
2. Provide a step-by-step solution, ensuring no steps are skipped.
3. Present your solution in a structured JSON format with the following fields:
   - "solution": An array of step objects, each containing:
     * "step": A sequential integer starting from 1
     * "action": A brief description of the mathematical operation performed
     * "equation": The resulting equation or expression in LaTeX format (DO NOT include $ or $$ delimiters)
     * "explanation": A concise explanation of the step (write LaTeX expressions without $ or $$ delimiters)
   - "final_answer": The final result (in LaTeX format)
4. Write all mathematical expressions in LaTeX notation WITHOUT any surrounding delimiters.
5. Ensure all LaTeX expressions are properly escaped for JSON.
6. Your response must be valid JSON that can be parsed directly.
 Now solve this problem:\\n${equation}` }
        ],
        temperature: 0.7,
        max_tokens: -1
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: DEFAULT_TIMEOUT
      });
    });

    if (!response.data?.choices?.[0]?.message) {
      throw new Error('Invalid response structure');
    }

    const jsonResponse = parseAndValidateResponse(response.data.choices[0].message.content);
    
    // Cache the successful response
    equationCache.set(cacheKey, JSON.stringify(jsonResponse));
    
    return JSON.stringify(jsonResponse);

  } catch (error) {
    console.error('Error processing equation:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Return graceful error response
    const errorResponse = {
      solution: [{
        step: 1,
        action: "Error occurred",
        equation: "N/A",
        explanation: `Error: ${error.message}. Please try again.`
      }],
      final_answer: "Processing error"
    };

    return JSON.stringify(errorResponse);
  }
}

function parseAndValidateResponse(content) {
  const cleanContent = content.replace(/```json|```/g, '').trim();
  try {
    const parsed = JSON.parse(cleanContent);
    
    // Validate required fields
    if (!Array.isArray(parsed.solution) || !parsed.final_answer) {
      throw new Error('Invalid response structure');
    }
    
    return parsed;
  } catch (error) {
    throw new Error(`JSON parsing failed: ${error.message}`);
  }
}

module.exports = { 
  processEquationWithQWEN,
  // Expose for testing
  standardizeEquation,
  parseAndValidateResponse
};

