// validation.js
const { visualizationSchemas } = require('../schemas/index.js');
const Joi = require('joi');

const schemas = {
  solve: Joi.object({
    equation: Joi.string().required().min(1).max(1000),
    visualization_type: Joi.string().valid(...visualizationSchemas.validTypes).required()
  }),
  
  visualize: Joi.object({
    equation: Joi.string().required().min(1).max(1000),
    visualization_type: Joi.string().valid(...visualizationSchemas.validTypes).required()
  })
};

const validateRequest = (req, res, next) => {
  const { path } = req;
  const schemaKey = path.split('/').pop(); // Gets 'solve' or 'visualize' from path
  
  // console.log('Validating request:', {
  //   path: req.path,
  //   body: req.body,
  //   schemaKey
  // });

  const schema = schemas[schemaKey];
  if (!schema) {
    console.error('Invalid schema key:', schemaKey);
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request path'
    });
  }

  const { error } = schema.validate(req.body);
  if (error) {
    console.error('Validation error:', {
      error: error.details[0].message,
      receivedData: req.body
    });
    return res.status(400).json({
      error: 'Validation Error',
      message: error.details[0].message,
      details: {
        received: req.body,
        allowedTypes: visualizationSchemas.validTypes
      }
    });
  }

  next();
};

module.exports = {
  validateRequest,
  schemas
};