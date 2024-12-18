// errorHandler.js

// Custom error class for API errors
class APIError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'APIError';
  }
}

// QWEN API specific error
class QWENError extends APIError {
  constructor(message, details = null) {
    super(message, 500, details);
    this.name = 'QWENError';
  }
}

// Validation error
class ValidationError extends APIError {
  constructor(message, details = null) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    details: err.details
  });

  // Handle different types of errors
  switch (err.name) {
    case 'ValidationError':
      return res.status(400).json({
        error: 'Validation Error',
        message: err.message,
        details: err.details
      });

    case 'QWENError':
      return res.status(500).json({
        error: 'QWEN API Error',
        message: err.message,
        details: err.details
      });

    case 'APIError':
      return res.status(err.statusCode).json({
        error: 'API Error',
        message: err.message,
        details: err.details
      });

    default:
      // Handle unexpected errors
      return res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? err.stack : null
      });
  }
};

// Async handler wrapper to catch async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not found handler
const notFoundHandler = (req, res, next) => {
  const error = new APIError('Resource not found', 404);
  next(error);
};

// Rate limiting error handler
const rateLimitHandler = (req, res) => {
  return res.status(429).json({
    error: 'Rate Limit Exceeded',
    message: 'Too many requests, please try again later',
    details: {
      retryAfter: res.getHeader('Retry-After')
    }
  });
};

// QWEN API response handler
const handleQWENResponse = (response) => {
  if (!response || !response.data) {
    throw new QWENError('Invalid QWEN API response');
  }

  if (response.error) {
    throw new QWENError('QWEN API error', response.error);
  }

  return response.data;
};

// Cache error handler
const handleCacheError = (error) => {
  console.error('Cache error:', error);
  // Continue without cache in case of error
  return null;
};

// Request timeout handler
const timeoutHandler = (req, res) => {
  return res.status(408).json({
    error: 'Request Timeout',
    message: 'The request has timed out',
    details: {
      timeoutPeriod: process.env.REQUEST_TIMEOUT || '30s'
    }
  });
};

// Export everything using CommonJS syntax
module.exports = {
  APIError,
  QWENError,
  ValidationError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  rateLimitHandler,
  handleQWENResponse,
  handleCacheError,
  timeoutHandler
};