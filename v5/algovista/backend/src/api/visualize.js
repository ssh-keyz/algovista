// At the top of both files
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { equation, visualization_type } = req.body;

    // Load schemas
    const visualizationSchemaPath = path.join(
      process.cwd(),
      "schemas",
      "visualization-schemas.json",
    );
    const schema = JSON.parse(await readFile(visualizationSchemaPath, "utf8"));

    // Get specific schema for visualization type
    const specificSchema =
      schema.visualization_schemas[
        visualization_type.toLowerCase().replace(/\s+/g, "_")
      ];

    // Construct prompt for QWEN2.5
    const prompt = {
      schema: specificSchema,
      equation: equation,
      visualization_type: visualization_type,
    };

    // Call QWEN2.5 API
    const qwenResponse = await fetch("YOUR_QWEN_ENDPOINT", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add any required API keys or authentication
      },
      body: JSON.stringify(prompt),
    });

    const visualizationData = await qwenResponse.json();

    // Validate response against schema before sending
    // Add validation logic here

    res.status(200).json(visualizationData);
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Error processing request", error: error.message });
  }
}
