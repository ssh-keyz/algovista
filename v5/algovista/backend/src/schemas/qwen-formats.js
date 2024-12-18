/**
 * This file contains the QWEN-specific response format functions.
 * These formats must match QWEN's expected schema structure exactly.
 * While we maintain our own JSON schemas for validation and documentation,
 * these functions provide the exact format that QWEN requires.
 */

function generateVisualizationFormat() {
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
}

function generateSolveFormat() {
  return {
    type: "json_schema",
    json_schema: {
      name: "math_solution_response",
      strict: "true",
      schema: {
        type: "object",
        required: ["solution", "final_answer"],
        properties: {
          solution: {
            type: "array",
            items: {
              type: "object",
              required: ["step", "action", "equation", "explanation"],
              properties: {
                step: {
                  type: "integer",
                  minimum: 1
                },
                action: {
                  type: "string",
                  minLength: 1
                },
                equation: {
                  type: "string",
                  minLength: 1
                },
                explanation: {
                  type: "string",
                  minLength: 1
                }
              }
            },
            minItems: 1
          },
          final_answer: {
            type: "string",
            minLength: 1
          }
        }
      }
    }
  };
}

module.exports = {
  generateVisualizationFormat,
  generateSolveFormat
}; 