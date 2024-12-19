/**
 * Schema Validation System for LLM Responses
 * 
 * This module provides a robust validation system for enforcing structured responses
 * from Large Language Models (LLMs). It addresses several critical challenges in LLM integration:
 * 
 * 1. Response Format Consistency: Ensures LLM outputs follow predefined schemas
 * 2. Data Quality: Validates all required fields are present and properly formatted
 * 3. Error Prevention: Catches malformed responses before they affect downstream systems
 * 4. Type Safety: Ensures response fields match expected data types
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";

/**
 * SchemaValidator Class
 * 
 * Core class for validating LLM responses against JSON schemas.
 * Uses AJV (Another JSON Validator) for high-performance validation
 * with support for JSON Schema Draft-07.
 */
export class SchemaValidator {
  constructor() {
    // Initialize AJV with strict validation and full error reporting
    this.ajv = new Ajv({ allErrors: true });
    // Add support for additional formats (e.g., date-time, email, etc.)
    addFormats(this.ajv);
  }

  /**
   * Validates solution responses from the LLM
   * 
   * @param {Object} solution - The LLM's solution response
   * @param {Object} schema - JSON schema defining expected solution format
   * @returns {boolean} True if validation passes
   * @throws {Error} Detailed validation error if schema validation fails
   * 
   * This method ensures solution responses contain:
   * - All required mathematical components
   * - Properly formatted step-by-step solutions
   * - Valid mathematical expressions
   */
  validateSolution(solution, schema) {
    const validate = this.ajv.compile(schema);
    const valid = validate(solution);

    if (!valid) {
      // Transform AJV errors into more readable format
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

  /**
   * Validates visualization specifications from the LLM
   * 
   * @param {Object} visualization - The LLM's visualization specification
   * @param {Object} schema - JSON schema defining expected visualization format
   * @returns {boolean} True if validation passes
   * @throws {Error} Detailed validation error if schema validation fails
   * 
   * Ensures visualization responses include:
   * - Valid coordinate systems
   * - Proper dimension specifications
   * - Required visual properties
   * - Correct data mappings
   */
  validateVisualization(visualization, schema) {
    const validate = this.ajv.compile(schema);
    const valid = validate(visualization);

    if (!valid) {
      // Transform AJV errors into more readable format
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

  /**
   * Extracts LaTeX templates for specific visualization types
   * 
   * @param {Object} templates - Collection of LaTeX templates
   * @param {string} visualizationType - Type of visualization
   * @returns {Array|null} Array of templates or null if not found
   * 
   * Helps maintain consistent mathematical notation across:
   * - Different visualization types
   * - Multiple response formats
   * - Various mathematical contexts
   */
  getLatexTemplates(templates, visualizationType) {
    const normalized = visualizationType.toLowerCase().replace(/\s+/g, "_");
    return templates[normalized]?.templates || null;
  }

  /**
   * Formats LaTeX templates with provided values
   * 
   * @param {string} template - LaTeX template string
   * @param {Object} values - Values to insert into template
   * @returns {string} Formatted LaTeX string
   * 
   * Ensures consistent formatting of:
   * - Mathematical expressions
   * - Equations
   * - Scientific notation
   * - Special mathematical symbols
   */
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
