const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const http = require('http');
const https = require('https');
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

// Configure HTTP and HTTPS agents with keep-alive
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 100,
  timeout: AXIOS_TIMEOUT
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 100,
  timeout: AXIOS_TIMEOUT
});

// Create axios instance with default config
const axiosInstance = axios.create({
  timeout: AXIOS_TIMEOUT,
  maxContentLength: 50 * 1024 * 1024, // 50MB
  maxBodyLength: 50 * 1024 * 1024, // 50MB
  httpAgent,
  httpsAgent,
  headers: {
    'Connection': 'keep-alive'
  }
});

// Queue for managing QWEN API requests
let isProcessing = false;
const requestQueue = [];

// Function to process the queue
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
    // Process next request if any
    processQueue();
  }
}

// Wrapper for QWEN API calls to use queue
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

// Retry mechanism with exponential backoff
async function retryWithBackoff(operation, maxRetries = MAX_RETRIES) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const delay = Math.min(1000 * Math.pow(2, i), 10000); // Max 10 second delay
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

// Helper function for API calls
async function callQwenAPI(prompt, schemaType, systemMessage = null) {
  const operation = async () => {
    try {
      const response_format = schemaType === 'solve' ? generateSolveFormat() : generateVisualizationFormat();
      const messages = [];
      if (systemMessage) {
        messages.push({ role: 'system', content: systemMessage });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await retryWithBackoff(async () => {
        return axiosInstance.post(QWEN_API_ENDPOINT, {
          model: 'qwen2.5-math-7b-instruct',
          messages,
          response_format,
          temperature: 0.7,
          max_tokens: -1,
          stream: false
        });
      });

      const content = response.data.choices[0].message.content;
      // console.log('API Response:', content);
      
      const jsonResponse = schemaType === 'solve' ? 
        parseAndValidateResponse(content) : 
        validateJSON(content);
      // console.log('JSON response:', jsonResponse);
      
      return JSON.stringify(jsonResponse);
    } catch (error) {
      console.error('API Error:', error.message);
      if (error.response) {
        console.error('API Response Error:', error.response.data);
      }
      throw error;
    }
  };

  return queueQwenRequest(operation);
}

const validateJSON = (content) => {
  // If content is already an object, skip parsing
  let parsedJSON;
  if (typeof content === 'object' && content !== null) {
    parsedJSON = content;
  } else {
    // Clean up common formatting issues
    const cleanContent = content
      .replace(/\n\s*/g, ' ')  // Replace newlines and following spaces with single space
      .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
      .replace(/,\s*}/g, '}')  // Remove trailing commas
      .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
    
    parsedJSON = JSON.parse(cleanContent);
  }

  // Validate required fields and structure
  const requiredFields = {
    function: ['raw', 'parsed', 'variables'],
    visualization_config: ['ranges', 'resolution', 'view_angles'],
    mathematical_properties: ['gradient']
  };

  // Check top-level fields
  for (const field of Object.keys(requiredFields)) {
    if (!parsedJSON[field]) {
      throw new Error(`Missing required top-level field: ${field}`);
    }
  }

  // Check function fields
  for (const field of requiredFields.function) {
    if (!parsedJSON.function[field]) {
      throw new Error(`Missing required field in function: ${field}`);
    }
  }

  // Check visualization_config fields
  const config = parsedJSON.visualization_config;
  for (const field of requiredFields.visualization_config) {
    if (!config[field]) {
      throw new Error(`Missing required field in visualization_config: ${field}`);
    }
  }

  // Check ranges has x and y
  if (!config.ranges.x || !config.ranges.y) {
    throw new Error('Ranges must include both x and y arrays');
  }

  // Check resolution has x and y
  if (!config.resolution.x || !config.resolution.y) {
    throw new Error('Resolution must include both x and y values');
  }

  // Check mathematical_properties
  const props = parsedJSON.mathematical_properties;
  for (const field of requiredFields.mathematical_properties) {
    if (!props[field]) {
      throw new Error(`Missing required field in mathematical_properties: ${field}`);
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
