# Contributing to AlgoVista

We're excited that you're interested in contributing to AlgoVista! This document outlines our contribution process and guidelines, covering both the practical application development and research aspects of the project.

## Areas of Contribution

### 1. Technical Development
- Frontend React components
- Backend API endpoints
- AI integration improvements
- Mathematical markup processing
- Performance optimizations
- Testing and validation

### 2. Research and Documentation
- AI behavior analysis
- Mathematical markup studies
- Performance benchmarking
- Use case documentation
- Research findings
- Implementation patterns

## Getting Started

1. **Fork the Repository**
   - Fork the AlgoVista repository to your GitHub account
   - Clone your fork locally
   ```bash
   git clone https://github.com/yourusername/algovista.git
   cd algovista
   ```

2. **Set Up Development Environment**
   - Follow setup instructions in main README.md
   - Ensure all tests pass before making changes
   ```bash
   # Backend setup
   cd backend
   cp .env.example .env
   npm install
   npm test

   # Frontend setup
   cd ../frontend
   cp .env.example .env
   npm install
   npm test
   ```

3. **Create a Branch**
   - Create a branch for your work
   - Use descriptive branch names
   ```bash
   git checkout -b feature/descriptive-feature-name
   # or
   git checkout -b research/research-topic-name
   ```

## Development Guidelines

### Code Style
- Use consistent indentation (2 spaces)
- Follow ESLint configurations
- Write meaningful comment blocks
- Use TypeScript types where applicable
- Follow React best practices

### Commit Messages
```
type(scope): Brief description

Detailed description of changes and reasoning
```
Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `research`: Research-related changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `perf`: Performance improvements

### Testing
- Write tests for new features
- Maintain or improve code coverage
- Include both unit and integration tests
- Test AI model interactions thoroughly

## Research Contribution Guidelines

### 1. Documentation
- Clear methodology description
- Reproducible experiments
- Well-documented findings
- Referenced related work

### 2. Experimental Results
- Include benchmark data
- Document testing environment
- Provide analysis methodology
- Share raw data when possible

### 3. AI Model Interactions
- Document prompt engineering
- Include example inputs/outputs
- Analyze failure cases
- Describe optimization attempts

## Pull Request Process

1. **Before Submitting**
   - Update documentation as needed
   - Add tests for new functionality
   - Ensure all tests pass
   - Update README if required
   - Check code style compliance

2. **PR Description Template**
   ```markdown
   ## Description
   [Detailed description of changes]

   ## Type of Change
   - [ ] Feature
   - [ ] Bug fix
   - [ ] Research
   - [ ] Documentation
   - [ ] Other (specify)

   ## Research Impact (if applicable)
   - Methodology affected
   - New findings
   - Performance implications

   ## Testing
   - Test cases added/modified
   - Benchmark results
   - AI model behavior changes

   ## Documentation
   - Files changed
   - Research notes added
   ```

3. **Review Process**
   - Two approvals required
   - All discussions resolved
   - CI checks passed
   - Documentation updated

## Research-Specific Guidelines

### Documenting AI Behavior
```markdown
## AI Model Analysis
- Model version:
- Input examples:
- Output patterns:
- Edge cases:
- Performance metrics:
```

### Mathematical Markup Studies
```markdown
## Markup Analysis
- Syntax patterns:
- Error cases:
- Processing overhead:
- Rendering implications:
```

## Best Practices

### AI Integration
- Document prompt engineering approaches
- Track model behavior changes
- Monitor performance metrics
- Report hallucination patterns
- Test edge cases thoroughly

### Mathematical Processing
- Validate LaTeX syntax
- Test with complex equations
- Document rendering issues
- Track performance impact
- Consider accessibility

## Communication

- Use GitHub Issues for bug reports
- Use Discussions for research topics
- Tag maintainers when needed
- Join our research meetings
- Share findings early

## Code Review Checklist

- [ ] Code style compliance
- [ ] Test coverage
- [ ] Documentation updates
- [ ] Research implications
- [ ] Performance impact
- [ ] Security considerations

## Getting Help

- Check existing issues
- Join our Discord server
- Attend office hours
- Read the research notes
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Questions?

Feel free to contact the maintainers or open an issue for clarification. We're here to help!

---

Thank you for contributing to AlgoVista! Your work helps advance both the practical and research aspects of AI-driven mathematical education.
