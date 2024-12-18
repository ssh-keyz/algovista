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
const DEFAULT_TIMEOUT = 70000; // 30 seconds
const MAX_RETRIES = 1;

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
      const delay = Math.min(1000 * Math.pow(2, i), 100000); // Max 10 second delay
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
      strict: "true",
      schema: baseSchema
    }
  };
};

// Helper function for API calls
async function callQwenAPI(prompt, schema, systemMessage = null) {
  const generateVisualizationFormat = () => {
    return {
      type: "json_schema",
      json_schema: {
        name: "visualization_response",
        strict: "true",
        schema: {
          type: "object",
          properties: {
            function: {
              type: "object",
              properties: {
                raw: { type: "string" },
                parsed: { type: "string" },
                variables: { 
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["raw", "parsed", "variables"]
            },
            visualization_config: {
              type: "object",
              properties: {
                ranges: {
                  type: "object",
                  properties: {
                    x: { type: "array", items: { type: "number" }},
                    y: { type: "array", items: { type: "number" }},
                    z: { type: "array", items: { type: "number" }}
                  }
                },
                resolution: {
                  type: "object",
                  properties: {
                    x: { type: "integer" },
                    y: { type: "integer" }
                  }
                },
                view_angles: {
                  type: "object",
                  properties: {
                    theta: { type: "number" },
                    phi: { type: "number" }
                  }
                }
              },
              required: ["ranges", "resolution", "view_angles"]
            },
            mathematical_properties: {
              type: "object",
              properties: {
                critical_points: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      x: { type: "number" },
                      y: { type: "number" },
                      z: { type: "number" },
                      type: { type: "string" }
                    }
                  }
                },
                gradient: {
                  type: "object",
                  properties: {
                    dx: { type: "string" },
                    dy: { type: "string" }
                  }
                }
              }
            }
          },
          required: ["function", "visualization_config", "mathematical_properties"]
        }
      }
    };
  };
  
  // const response_format = generateResponseFormat(schema);
  const response_format = generateVisualizationFormat();
  // const response_format = {
  //   "type": "json_schema",
  //   "json_schema": {
  //     "name": "visualization_response",
  //     "strict": "true",
  //     "schema": {
  //       "type": "object",
  //       "properties": {
  //         "function": {
  //           "type": "object",
  //           "properties": {
  //             "raw": { "type": "string" },
  //             "parsed": { "type": "string" },
  //             "variables": { 
  //               "type": "array",
  //               "items": { "type": "string" }
  //             }
  //           },
  //           "required": ["raw", "parsed", "variables"]
  //         }
  //       },
  //       "required": ["function"]
  //     }
  //   }
  // };
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
    console.log('raw response');
    console.log(response.data.choices[0].message.content);
    // return response.data;
    // if (!response.data?.choices?.[0]?.message) {
    // if (!response.data) {
    //   throw new Error('Invalid response structure');
    // }

    const jsonResponse = validateJSON(response.data.choices[0].message.content);
    console.log('json response');
    console.log(jsonResponse);
    // Cache the successful response
    // equationCache.set(cacheKey, JSON.stringify(jsonResponse));
    
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
    // Parse the stringified response
    const parsedVisualization = JSON.parse(visualization);
    res.json(parsedVisualization);
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
