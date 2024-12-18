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
  errorHandler, 
  notFoundHandler, 
  rateLimitHandler 
} = require('./middleware/errorHandler.js');
const { validateRequest } = require('./middleware/validation.js');

// Load environment variables
dotenv.config();

const app = express();
const QWEN_API_ENDPOINT = process.env.QWEN_API_ENDPOINT;
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

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
      console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
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

const generateResponseFormat = (jsonFile) => {
  // Determine which schema type we're dealing with
  let schemaName;
  let baseSchema;
  
  if (jsonFile.title === "Mathematical Solution State") {
    schemaName = "math_solution_response";
    baseSchema = {
      type: "object",
      properties: {
        solution: jsonFile.properties.solution,
        final_answer: jsonFile.properties.final_answer
      },
      required: jsonFile.required
    };
  } else if (jsonFile.title === "LaTeX Templates") {
    schemaName = "latex_template_response";
    baseSchema = {
      type: "object",
      properties: {
        templates: {
          type: "object",
          properties: jsonFile.properties
        }
      },
      required: ["templates"]
    };
  } else if (jsonFile.title === "Visualization Schemas") {
    schemaName = "visualization_response";
    baseSchema = {
      type: "object",
      properties: {
        visualization: jsonFile.properties.visualization_schemas
      },
      required: ["visualization"]
    };
  } else {
    throw new Error("Unsupported schema type");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schemaName,
      schema: baseSchema
    }
  };
};

// Helper function for API calls
async function callQwenAPI(prompt, schema, systemMessage = null) {
  const response_format = generateResponseFormat(schema);
  try {
    const messages = [];
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }
    messages.push({ role: 'user', content: prompt });

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
        timeout: DEFAULT_TIMEOUT
      });
    });

    return response.data;
  } catch (error) {
    console.error('API call failed:', error.response?.data || error.message);
    throw error;
  }
}

// Routes
app.post('/api/solve', validateRequest, async (req, res, next) => {
  try {
    const { equation, visualization_type } = req.body;
    const prompt = `Solve this ${visualization_type} equation: ${equation}. Format the response exactly according to this schema: ${JSON.stringify(solveSchema)}`;
    
    const solution = await callQwenAPI(prompt, solveSchema);
    res.json(solution.choices[0].message.content);
  } catch (error) {
    console.error('Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      details: error.details
    });
    next(error);
  }
});

app.post('/api/visualize', validateRequest, async (req, res, next) => {
  try {
    const { equation, visualization_type } = req.body;
    const prompt = `Visualize this equation: ${equation} using ${visualization_type}. Format the response exactly according to the visualization schema for type: ${visualization_type}`;
    
    const visualization = await callQwenAPI(prompt, visualizeSchemas);
    res.json(visualization.choices[0].message.content);
  } catch (error) {
    console.error('Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      details: error.details
    });
    next(error);
  }
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
