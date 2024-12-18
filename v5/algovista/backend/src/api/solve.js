const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { equation, visualization_type } = req.body;

    // Load schemas
    const solveSchemaPath = path.join(
      process.cwd(),
      "schemas",
      "solve-schema.json",
    );
    const latexTemplatesPath = path.join(
      process.cwd(),
      "schemas",
      "latex-templates.json",
    );

    const solveSchema = JSON.parse(await readFile(solveSchemaPath, "utf8"));
    const latexTemplates = JSON.parse(
      await readFile(latexTemplatesPath, "utf8"),
    );

    // Construct prompt for QWEN2.5
    const prompt = {
      schema: solveSchema,
      latex_templates: latexTemplates[visualization_type].templates,
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

    const solution = await qwenResponse.json();

    // Validate response against schema before sending
    // Add validation logic here

    res.status(200).json(solution);
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Error processing request", error: error.message });
  }
};
