# AlgoVista Frontend

AlgoVista is a sophisticated mathematical equation solver with an intuitive React-based frontend. It provides step-by-step solutions to calculus problems with beautiful LaTeX rendering and interactive graphing capabilities.

## Features

- **Interactive Equation Input**: Clean, user-friendly interface for entering mathematical equations
- **Step-by-Step Solutions**: Detailed solution breakdown with LaTeX rendering
- **Mathematical Visualization**: Real-time function graphing using Recharts
- **Dark Mode Interface**: Modern, eye-friendly dark theme
- **Responsive Design**: Works seamlessly across different screen sizes
- **Pop-up Solution Window**: Dedicated space for viewing solutions and graphs
- **LaTeX Support**: Beautiful mathematical notation rendering using KaTeX

## Tech Stack

- React.js
- Axios for API requests
- KaTeX for LaTeX rendering (react-katex)
- Recharts for function visualization
- Create React App as the build tool

## Prerequisites

Before setting up the project, ensure you have:

- Node.js (Latest LTS version recommended)
- npm (Comes with Node.js)
- Access to the AlgoVista backend service

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd algovista-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```plaintext
REACT_APP_API_URL=http://localhost:3000
PORT=3001
```

## Development

To start the development server:

```bash
npm start
```

The application will be available at `http://localhost:3001`.

## Building for Production

To create a production build:

```bash
npm run build
```

This will create an optimized build in the `build` directory.

## Project Structure

```
src/
├── components/          # Reusable React components
│   └── solutionStep.js # Step-by-step solution renderer
├── App.js              # Main application component
├── App.css             # Main styles
└── index.js            # Application entry point
```

## Key Components

### SolutionStep
- Renders individual solution steps
- Handles LaTeX formatting
- Custom styling with gradient headers

### App
- Main application logic
- Equation input handling
- Graph generation
- API integration
- Pop-up window management

## Styling

The application uses a custom dark theme with:
- Primary color: #61dafb (React blue)
- Background: #1e1e1e
- Text: #e0e0e0
- Accents: Various shades of gray (#2c2c2c, #3c3c3c)

## API Integration

The frontend communicates with the AlgoVista backend through:
- POST `/api/solve` - Submits equations for solving
- Response format:
```json
{
  "solution": [
    {
      "step": 1,
      "action": "...",
      "equation": "...",
      "explanation": "..."
    }
  ],
  "final_answer": "..."
}
```

## Features in Detail

### Equation Input
- Text input field for entering mathematical equations
- Real-time validation and processing
- Submit button for solution generation

### Solution Display
- Step-by-step breakdown
- LaTeX rendering for mathematical notation
- Clear visual hierarchy
- Final answer emphasis

### Graph Visualization
- Interactive function plotting
- Responsive graph sizing
- Grid lines and axes
- Tooltip support
- Custom styling for dark theme

## Contributing

1. Fork the repository
2. Create your feature branch
3. Copy `.env.example` to `.env` and configure
4. Install dependencies with `npm install`
5. Make your changes
6. Test your changes
7. Create a pull request

## Available Scripts

- `npm start`: Runs the development server
- `npm test`: Runs the test suite
- `npm run build`: Creates a production build
- `npm run eject`: Ejects from Create React App

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Known Issues

- Graph visualization may not handle all complex mathematical functions
- LaTeX rendering may have slight delays with complex equations
