const express = require('express');
const { processEquationWithQWEN } = require('../qwenIntegration');

const router = express.Router();

// Route to solve an equation
router.post('/solve', async (req, res) => {
  const { equation } = req.body;
  if (!equation) {
    return res.status(400).json({ error: 'Equation is required' });
  }

  try {
    console.log(`Received equation: ${equation}`);
    const solution = await processEquationWithQWEN(equation);
    console.log(`Solution generated: ${solution}`);
    res.json(JSON.parse(solution));
  } catch (error) {
    console.error('Error processing equation:', error);
    res.status(500).json({
      error: 'Failed to process equation',
      details: error.message
    });
  }
});

// Route to get equation history (placeholder for now)
router.get('/history', (req, res) => {
  // TODO: Implement fetching equation history
  res.json({ message: 'History endpoint not implemented yet' });
});

// Route to visualize an equation (placeholder for now)
router.post('/visualize', (req, res) => {
  const { equation, type } = req.body;
  // TODO: Implement visualization generation
  res.json({ message: 'Visualization endpoint not implemented yet' });
});

module.exports = router;