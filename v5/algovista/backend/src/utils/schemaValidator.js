// utils/schemaValidator.js
import Ajv from "ajv";
import addFormats from "ajv-formats";

export class SchemaValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
  }

  validateSolution(solution, schema) {
    const validate = this.ajv.compile(schema);
    const valid = validate(solution);

    if (!valid) {
      const errors = validate.errors.map((error) => ({
        path: error.instancePath,
        message: error.message,
        params: error.params,
      }));

      throw new Error(
        JSON.stringify({
          message: "Solution validation failed",
          errors,
        }),
      );
    }

    return true;
  }

  validateVisualization(visualization, schema) {
    const validate = this.ajv.compile(schema);
    const valid = validate(visualization);

    if (!valid) {
      const errors = validate.errors.map((error) => ({
        path: error.instancePath,
        message: error.message,
        params: error.params,
      }));

      throw new Error(
        JSON.stringify({
          message: "Visualization validation failed",
          errors,
        }),
      );
    }

    return true;
  }

  // Helper method to extract LaTeX templates for a specific visualization type
  getLatexTemplates(templates, visualizationType) {
    const normalized = visualizationType.toLowerCase().replace(/\s+/g, "_");
    return templates[normalized]?.templates || null;
  }

  // Helper method to format LaTeX template with values
  formatLatexTemplate(template, values) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return values[key] || match;
    });
  }
}

// Example usage in API routes:
/*
import { SchemaValidator } from '../utils/schemaValidator';

const validator = new SchemaValidator();

// In solve API:
const valid = validator.validateSolution(qwenResponse, solveSchema);

// In visualize API:
const valid = validator.validateVisualization(qwenResponse, specificSchema);
*/
