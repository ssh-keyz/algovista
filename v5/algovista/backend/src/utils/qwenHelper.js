const axios = require('axios');

/**
 * QwenHelper - A class to manage interactions with the Qwen LLM API
 * Abstracts core functionality from server.js for better maintainability:
 * - Queue management
 * - API interaction
 * - Response validation
 * - Retry logic
 */
class QwenHelper {
  constructor(apiEndpoint, options = {}) {
    if (!apiEndpoint) {
      throw new Error('QWEN_API_ENDPOINT must be provided');
    }
    
    this.apiEndpoint = apiEndpoint;
    this.maxRetries = options.maxRetries || 2;
    this.timeout = options.timeout || 1800000; // 30 minutes default
    this.isProcessing = false;
    this.requestQueue = [];
  }

  /**
   * Queues an LLM API request for processing
   * @param {Function} operation - Async function containing the API call
   * @returns {Promise} Resolves with API response or rejects with error
   */
  async queueRequest(operation) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ operation, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Processes queued LLM API requests sequentially
   */
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    const { operation, resolve, reject } = this.requestQueue.shift();
    
    try {
      const result = await operation();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }

  /**
   * Implements exponential backoff retry mechanism
   * @param {Function} operation - The API operation to retry
   */
  async retryWithBackoff(operation) {
    let lastError;
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  /**
   * Core LLM API interaction method
   * @param {string} prompt - The prompt to send to the LLM
   * @param {string} schemaType - Type of response schema to validate against
   * @param {object} options - Additional options for the API call
   */
  async callQwen(prompt, schemaType, options = {}) {
    const operation = async () => {
      try {
        const messages = [];
        if (options.systemMessage) {
          messages.push({ role: 'system', content: options.systemMessage });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await this.retryWithBackoff(async () => {
          return axios.post(this.apiEndpoint, {
            model: 'qwen2.5-math-7b-instruct',
            messages,
            response_format: options.responseFormat,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || -1,
            stream: false
          }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: this.timeout,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });
        });

        const content = response.data.choices[0].message.content;
        return this.validateResponse(content, schemaType);
      } catch (error) {
        console.error('API Error:', error.message);
        if (error.response) {
          console.error('API Response Error:', error.response.data);
        }
        throw error;
      }
    };

    return this.queueRequest(operation);
  }

  /**
   * Validates and normalizes JSON responses
   * @param {string|object} content - Raw API response
   * @param {string} schemaType - Type of schema to validate against
   */
  validateResponse(content, schemaType) {
    if (schemaType === 'solve') {
      return this.validateSolveResponse(content);
    }
    return this.validateVisualizationResponse(content);
  }

  validateSolveResponse(content) {
    const cleanContent = content.replace(/```json|```/g, '').trim();
    try {
      const parsed = JSON.parse(cleanContent);
      
      if (!Array.isArray(parsed.solution) || !parsed.final_answer) {
        throw new Error('Invalid solve response structure');
      }
      
      return parsed;
    } catch (error) {
      throw new Error(`JSON parsing failed for solve response: ${error.message}`);
    }
  }

  validateVisualizationResponse(content) {
    let parsedJSON;
    if (typeof content === 'object' && content !== null) {
      parsedJSON = content;
    } else {
      const cleanContent = content
        .replace(/\n\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      
      parsedJSON = JSON.parse(cleanContent);
    }

    const requiredFields = {
      function: ['raw', 'parsed', 'variables'],
      visualization_config: ['ranges', 'resolution', 'view_angles'],
      mathematical_properties: ['gradient']
    };

    for (const [field, subfields] of Object.entries(requiredFields)) {
      if (!parsedJSON[field]) {
        throw new Error(`Missing required top-level field: ${field}`);
      }
      
      for (const subfield of subfields) {
        if (!parsedJSON[field][subfield]) {
          throw new Error(`Missing required field in ${field}: ${subfield}`);
        }
      }
    }

    return parsedJSON;
  }
}

module.exports = QwenHelper;