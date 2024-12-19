const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const solveSchema = require('./schemas/solve-schema.json');
const visualizeSchemas = require('./schemas/visualization-schemas.json');
const { 
  generateVisualizationFormat,
  generateSolveFormat 
} = require('./schemas/qwen-formats.js');
const { 
  errorHandler, 
  notFoundHandler, 
  rateLimitHandler 
} = require('./middleware/errorHandler.js');
const { validateRequest } = require('./middleware/validation.js');

// Load environment variables
dotenv.config();

const app = express();
const QWEN_API_ENDPOINT = process.env.QWEN_API_ENDPOINT;
const DEFAULT_TIMEOUT = 1800000; // 30 minutes
const AXIOS_TIMEOUT = 1800000; // 30 minutes for axios calls
const MAX_RETRIES = 2;

/**
 * Queue Management System for LLM API Requests
 * 
 * This implementation addresses several critical challenges in LLM API integration:
 * 1. Rate limiting: Prevents overwhelming the API with concurrent requests
 * 2. Request ordering: Maintains FIFO order for fairness
 * 3. Resource management: Controls memory usage by processing one request at a time
 * 4. Error isolation: Prevents cascading failures
 */
let isProcessing = false;
const requestQueue = [];

/**
 * Processes queued LLM API requests sequentially
 * This pattern ensures:
 * - Controlled concurrency
 * - Proper error handling
 * - Request isolation
 * - Memory efficiency
 */
async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  const { operation, resolve, reject } = requestQueue.shift();
  
  try {
    const result = await operation();
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    isProcessing = false;
    processQueue();
  }
}

/**
 * Queues an LLM API request for processing
 * @param {Function} operation - Async function containing the API call
 * @returns {Promise} Resolves with API response or rejects with error
 * 
 * Key features:
 * - Promise-based interface for async operations
 * - Maintains request order
 * - Provides isolation between requests
 */
async function queueQwenRequest(operation) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ operation, resolve, reject });
    processQueue();
  });
}

// Configure express with increased timeout and limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set server timeout (practically infinite for development)
app.use((req, res, next) => {
  req.setTimeout(DEFAULT_TIMEOUT);
  res.setTimeout(DEFAULT_TIMEOUT);
  next();
});

// Validate required environment variables
if (!QWEN_API_ENDPOINT) {
  console.error('Missing required environment variable: QWEN_API_ENDPOINT must be set');
  process.exit(1);
}

/**
 * Implements exponential backoff retry mechanism for LLM API calls
 * 
 * @param {Function} operation - The API operation to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * 
 * Benefits:
 * - Handles transient API failures gracefully
 * - Prevents overwhelming API during recovery
 * - Improves request success rate
 * - Implements best practices for API interaction
 */
async function retryWithBackoff(operation, maxRetries = MAX_RETRIES) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      // Exponential backoff with max delay of 10 seconds
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  handler: rateLimitHandler
});

app.use(limiter);

/**
 * Core LLM API interaction function
 * 
 * @param {string} prompt - The prompt to send to the LLM
 * @param {string} schemaType - Type of response schema to validate against
 * @param {string} systemMessage - Optional system message for context
 * 
 * Key features:
 * 1. Structured prompt formatting
 * 2. Response validation
 * 3. Error handling
 * 4. Queue management
 * 5. Retry logic
 * 6. Schema enforcement
 */
async function callQwenAPI(prompt, schemaType, systemMessage = null) {
  const operation = async () => {
    try {
      // Format response according to schema type
      const response_format = schemaType === 'solve' ? generateSolveFormat() : generateVisualizationFormat();
      
      // Construct messages array with optional system context
      const messages = [];
      if (systemMessage) {
        messages.push({ role: 'system', content: systemMessage });
      }
      messages.push({ role: 'user', content: prompt });

      // Make API call with retry mechanism
      const response = await retryWithBackoff(async () => {
        return axios.post(QWEN_API_ENDPOINT, {
          model: 'qwen2.5-math-7b-instruct',
          messages,
          response_format,
          temperature: 0.7,
          max_tokens: -1,
          stream: false
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: AXIOS_TIMEOUT,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });
      });

      // Extract and validate response
      const content = response.data.choices[0].message.content;
      const jsonResponse = schemaType === 'solve' ? 
        parseAndValidateResponse(content) : 
        validateJSON(content);
      
      return JSON.stringify(jsonResponse);
    } catch (error) {
      console.error('API Error:', error.message);
      if (error.response) {
        console.error('API Response Error:', error.response.data);
      }
      throw error;
    }
  };

  // Queue the operation
  return queueQwenRequest(operation);
}

/**
 * Response validation and normalization
 * 
 * @param {string|object} content - Raw API response
 * @returns {object} Validated and normalized JSON response
 * 
 * Handles common LLM response issues:
 * 1. Malformed JSON
 * 2. Missing required fields
 * 3. Inconsistent formatting
 * 4. Schema validation
 */
const validateJSON = (content) => {
  // Handle both string and object inputs
  let parsedJSON;
  if (typeof content === 'object' && content !== null) {
    parsedJSON = content;
  } else {
    // Clean up common LLM response formatting issues
    const cleanContent = content
      .replace(/\n\s*/g, ' ')  // Replace newlines and following spaces with single space
      .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
      .replace(/,\s*}/g, '}')  // Remove trailing commas
      .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
    
    parsedJSON = JSON.parse(cleanContent);
  }

  // Define and validate required response structure
  const requiredFields = {
    function: ['raw', 'parsed', 'variables'],
    visualization_config: ['ranges', 'resolution', 'view_angles'],
    mathematical_properties: ['gradient']
  };

  // Validate top-level fields and their required subfields
  for (const field of Object.keys(requiredFields)) {
    if (!parsedJSON[field]) {
      throw new Error(`Missing required top-level field: ${field}`);
    }
    
    // Validate subfields for each top-level field
    for (const subfield of requiredFields[field]) {
      if (!parsedJSON[field][subfield]) {
        throw new Error(`Missing required field in ${field}: ${subfield}`);
      }
    }
  }

  return parsedJSON;
};


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
// Routes
app.post('/api/solve', validateRequest, async (req, res, next) => {
  try {
    const { equation, visualization_type } = req.body;
    console.log('Solving equation:', equation, 'Type:', visualization_type);
    
    const prompt = `Solve this ${visualization_type} equation: ${equation}. Format the response exactly according to this schema: ${JSON.stringify(solveSchema)}`;
    
    const solution = await callQwenAPI(prompt, 'solve');
    const parsedSolution = JSON.parse(solution);
    res.json(parsedSolution);
  } catch (error) {
    console.error('Solve Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      details: error.details
    });
    res.status(500).json({ 
      error: 'Failed to process equation',
      details: error.message 
    });
  }
});

app.post('/api/visualize', validateRequest, async (req, res, next) => {
  try {
    const { equation, visualization_type } = req.body;
    console.log('Visualizing equation:', equation, 'Type:', visualization_type);
    
    const prompt = `Visualize this equation: ${equation} using ${visualization_type}. Format the response exactly according to the visualization schema for type: ${visualization_type}`;
    
    const visualization = await callQwenAPI(prompt, 'visualize');
    const parsedVisualization = JSON.parse(visualization);
    res.json(parsedVisualization);
  } catch (error) {
    console.error('Visualization Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      details: error.details
    });
    res.status(500).json({ 
      error: 'Failed to visualize equation',
      details: error.message 
    });
  }
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
