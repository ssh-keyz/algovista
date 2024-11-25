# AlgoVista Backend

AlgoVista is a sophisticated mathematical equation solving backend service that leverages advanced language models to provide detailed, step-by-step solutions to calculus problems. The service is built with Express.js and integrates with a QWEN language model for processing mathematical equations.

## Features

- **Step-by-Step Solutions**: Processes calculus problems with detailed explanations for each step
- **LaTeX Support**: Returns mathematical expressions in LaTeX format for proper rendering
- **JSON-Structured Responses**: Provides solutions in a well-structured JSON format
- **RESTful API**: Clean and intuitive API endpoints for equation processing
- **CORS Support**: Configured for secure cross-origin requests
- **Error Handling**: Comprehensive error handling and logging
- **Environment-Based Configuration**: Secure configuration management using environment variables

## Tech Stack

- Node.js
- Express.js
- Axios for API requests
- CORS for cross-origin resource sharing
- Body-parser for request parsing
- Dotenv for environment variable management

## Prerequisites

Before setting up the project, ensure you have:

- Node.js (Latest LTS version recommended)
- npm (Comes with Node.js)
- Access to a QWEN language model endpoint

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd algovista-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

4. Configure your `.env` file with the following variables:
```plaintext
QWEN_API_URL=your_qwen_api_endpoint_here
PORT=3000
FRONTEND_URL=http://localhost:3001
```

## Environment Configuration

The project uses environment variables for configuration. These are managed through a `.env` file in development and should be set in your deployment platform for production.

Required environment variables:
- `QWEN_API_URL`: Your QWEN language model API endpoint
- `PORT`: The port number for the server (defaults to 3000)
- `FRONTEND_URL`: The URL of your frontend application for CORS

Note: Never commit the `.env` file to version control. The `.env.example` file is provided as a template.

## Usage

### Starting the Server

Development mode (with hot reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### API Endpoints

#### 1. Solve Equation
```http
POST /api/solve
```

Request body:
```json
{
  "equation": "Find the derivative of x^2 + 2x + 1"
}
```

Response format:
```json
{
  "solution": [
    {
      "step": 1,
      "action": "Apply power rule to x^2",
      "equation": "$\\frac{d}{dx}(x^2) = 2x$",
      "explanation": "The derivative of x^n is nx^(n-1)"
    },
    // Additional steps...
  ],
  "final_answer": "$2x + 2$"
}
```

#### 2. Get History (Placeholder)
```http
GET /api/history
```

#### 3. Visualize Equation (Placeholder)
```http
POST /api/visualize
```

## Error Handling

The API includes comprehensive error handling:

- 400: Bad Request (e.g., missing equation)
- 500: Server Error (e.g., QWEN API issues)

Example error response:
```json
{
  "error": "Failed to process equation",
  "details": "Error message details"
}
```

## Development and Testing

The project uses nodemon for development, providing automatic server restarts when files change. Run the development server using:

```bash
npm run dev
```

## Deployment

When deploying to production:

1. Do not commit or deploy the `.env` file
2. Set environment variables in your deployment platform
3. Ensure `QWEN_API_URL` is properly secured and encrypted
4. Configure `FRONTEND_URL` to match your production frontend URL
5. Set `NODE_ENV=production` in your deployment environment

## Security Considerations

- Environment variables are used for sensitive configuration
- CORS is configured to accept requests only from the specified frontend origin
- Request body size is limited by body-parser
- All API responses include appropriate error handling
- Timeouts are configured for external API calls
- `.env` file is excluded from version control
- Example configuration is provided in `.env.example`

