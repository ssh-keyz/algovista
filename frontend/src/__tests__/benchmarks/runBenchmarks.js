// Example usage of the benchmarking suite
import { Benchmark } from './Benchmark';
import { originalRenderExplanation, optimizedRenderExplanation } from './parsers/equationParser';
import { Cache } from '../../services/cache.js';

async function runPerformanceComparison() {
  const benchmark = new Benchmark();
  const cache = new Cache();
  
  // Test equation
  const testEquation = 'f(x) = 2x^2 + 3x + 1';
  
  // Test props for rendering
  const renderProps = {
    equation: testEquation,
    steps: [
      { explanation: 'First, let\'s identify the coefficients: $a=2$, $b=3$, $c=1$' },
      { explanation: 'The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$' },
      { explanation: 'Substituting our values: $x = \\frac{-3 \\pm \\sqrt{3^2 - 4(2)(1)}}{2(2)}$' }
    ]
  };

  // Run pre-optimization benchmarks
  console.log('Running pre-optimization benchmarks...');
  const preOptimization = await benchmark.runBenchmarkSuite({
    equation: testEquation,
    parseFunction: originalRenderExplanation,
    RenderComponent: originalRenderExplanation,
    renderProps,
    cache
  });

  // Run post-optimization benchmarks
  console.log('Running post-optimization benchmarks...');
  const postOptimization = await benchmark.runBenchmarkSuite({
    equation: testEquation,
    parseFunction: optimizedRenderExplanation,
    RenderComponent: optimizedRenderExplanation,
    renderProps,
    cache
  });

  // Generate and display report
  const report = benchmark.generateReport(preOptimization, postOptimization);
  
  console.log('Performance Improvement Report:');
  console.log('==============================');
  console.log('Parsing Performance:');
  console.log(`- Mean time reduction: ${report.parsingImprovement.meanReduction}`);
  console.log(`- 95th percentile improvement: ${report.parsingImprovement.p95Reduction}`);
  
  console.log('\nRendering Performance:');
  console.log(`- FPS increase: ${report.renderingImprovement.fpsIncrease}`);
  console.log(`- Frame time reduction: ${report.renderingImprovement.frameTimeReduction}`);
  
  console.log('\nMemory Usage:');
  console.log(`- Memory reduction: ${report.memoryImprovement?.reduction || 'Not available'}`);
  
  if (report.cacheEffectiveness) {
    console.log('\nCache Performance:');
    console.log(`- Cache hit rate: ${report.cacheEffectiveness.hitRate}`);
  }

  return report;
}

// Run the benchmarks
runPerformanceComparison()
  .then(report => {
    // Save results or use them in your research
    console.log('Benchmark complete!');
  })
  .catch(error => {
    console.error('Error running benchmarks:', error);
  });


export { runPerformanceComparison };