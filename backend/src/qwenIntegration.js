require('dotenv').config();

const axios = require('axios');

const API_URL = process.env.QWEN_API_URL;

// const API_URL = 'http://localhost:1234/v1/chat/completions'; // Updated to use port 1234

async function processEquationWithQWEN(equation) {
  console.log(`Attempting to process equation: ${equation}`);
  console.log(`Using API URL: ${API_URL}`);

  try {
    console.log('Sending request to LM Studio...');
    // const response = await axios.post(API_URL, {
    //   messages: [
    //     { role: "user", content: `Solve the following calculus problem step by step:\n${equation}` }
    //   ],
    //   temperature: 0.7,
    //   max_tokens: -1
    // }, {
    const response = await axios.post(API_URL, {
      messages: [
        { role: "user", content: `You are the world's greatest calculus tutor, known for your clear and detailed step-by-step solutions. Your task is to solve calculus problems with precision and clarity. Follow these instructions:

1. Analyze the given calculus problem carefully.
2. Provide a step-by-step solution, ensuring no steps are skipped.
3. Present your solution in a structured JSON format with the following fields:
   - "solution": An array of step objects, each containing:
     * "step": A sequential integer starting from 1
     * "action": A brief description of the mathematical operation performed
     * "equation": The resulting equation or expression after the action (in LaTeX format)
     * "explanation": A concise explanation of the step (may include LaTeX expressions)
   - "final_answer": The final result (in LaTeX format)
4. Use LaTeX notation for all mathematical expressions, surrounded by $ for inline math and $$ for display math.
5. Ensure both your response and all LaTeX is valid JSON. \\n${equation}` }
      ],
      temperature: 0.7,
      max_tokens: -1
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 300000 // 30 second timeout
    });

    console.log('Received response from LM Studio');
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Raw response data:', response.data);

    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      console.log('Raw response content:', response.data.choices[0].message.content);

      // Parse the JSON from the response content
      let jsonResponse;
      try {
        jsonResponse = removeJsonMarker(response.data.choices[0].message.content);
        jsonResponse = JSON.parse(jsonResponse);
        // jsonResponse = JSON.parse(response.data.choices[0].message.content);
        // jsonResponse = parseQWENResponse(response);
        console.log('Parsed JSON response:', jsonResponse);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Invalid JSON response from LM Studio');
      }

      return JSON.stringify(jsonResponse);
    } else {
      console.error('Unexpected response structure:', response.data);
      throw new Error('Unexpected response structure from L M Studio');
    }
  } catch (error) {
    console.error('Error processing equation:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    console.error('Error config:', error.config);

    return JSON.stringify({
      solution: [
        {
          step: 1,
          action: "Error occurred",
          equation: "N/A",
          explanation: `An error occurred while processing the equation: ${error.message}. Please ensure LM Studio is running and try again.`
        }
      ],
      final_answer: "Unable to process the equation due to an error."
    });
  }
}

function removeJsonMarker(text) {
  return text.replace(/```json|```/g, '');
}

module.exports = { processEquationWithQWEN };
