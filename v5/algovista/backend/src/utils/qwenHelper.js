const axios = require('axios');
const cache = require('./cache');

class QwenHelper {
  constructor(apiKey, baseURL = 'your-qwen-endpoint') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async generatePrompt(type, equation, additionalParams = {}) {
    const prompts = {
      solve: `Analyze and solve the following mathematical equation step by step. 
      Provide detailed explanations using LaTeX notation where appropriate.
      Equation: ${equation}`,
      
      visualize: `Generate a visualization specification for the following mathematical concept.
      Type: ${type}
      Equation: ${equation}
      Additional Parameters: ${JSON.stringify(additionalParams)}
      Return the response in the exact JSON schema specified.`
    };

    return prompts[type] || '';
  }

  async callQwen(type, equation, additionalParams = {}) {
    try {
      // Check cache first
      const cacheKey = `${type}-${equation}-${JSON.stringify(additionalParams)}`;
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult) {
        console.log('Cache hit for:', cacheKey);
        return cachedResult;
      }

      // Generate appropriate prompt
      const prompt = await this.generatePrompt(type, equation, additionalParams);

      // Call QWEN2.5 API
      const response = await this.client.post('/', {
        model: 'QWEN2.5',
        messages: [
          { role: 'system', content: 'You are a mathematical analysis and visualization expert. Provide detailed, step-by-step solutions and visualization specifications following the exact JSON schema provided.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      // Process and validate response
      const result = response.data.choices[0].message.content;
      
      // Cache the result
      await cache.set(cacheKey, result, 3600); // Cache for 1 hour
      
      return result;
    } catch (error) {
      console.error('QWEN API Error:', error);
      throw new Error(`Failed to process with QWEN2.5: ${error.message}`);
    }
  }

  async solve(equation) {
    return this.callQwen('solve', equation);
  }

  async visualize(type, equation, additionalParams = {}) {
    return this.callQwen('visualize', equation, { type, ...additionalParams });
  }

  // Helper method to parse LaTeX in responses
  static parseLatex(text) {
    // Remove unnecessary escaping and normalize LaTeX
    return text
      .replace(/\\\\/g, '\\')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = QwenHelper;