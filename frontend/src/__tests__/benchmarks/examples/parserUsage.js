// frontend/src/__tests__/benchmarks/examples/parserUsage.js
import Benchmark from '../Benchmark';
import { 
  originalRenderExplanation, 
  optimizedRenderExplanation,
  parseEquation 
} from '../parsers/equationParser';
import { Cache } from '../../services/cache';

async function runParserBenchmarks() {
  const benchmark = new Benchmark();
  const cache = new Cache();

  // Test equations
  const testCases = [
    {
      equation: 'f(x) = 2x + 1',
      explanation: 'This is a linear equation where $a = 2$ and $b = 1$'
    },
    {
      equation: 'f(x) = x² + 2x + 1',
      explanation: 'This is a quadratic equation where $a = 1$, $b = 2$, and $c = 1$'
    },
    {
      equation: 'f(x) = sin(x)',
      explanation: 'This is a trigonometric function $\\sin(x)$'
    }
  ];

  // Benchmark original implementation
  console.log('Running benchmarks for original implementation...');
  const preOptimization = await benchmark.runBenchmarkSuite({
    equation: testCases[0].equation,
    parseFunction: originalRenderExplanation,
    RenderComponent: ({text}) => originalRenderExplanation(text),
    renderProps: { text: testCases[0].explanation },
    cache
  });

  // Benchmark optimized implementation
  console.log('Running benchmarks for optimized implementation...');
  const postOptimization = await benchmark.runBenchmarkSuite({
    equation: testCases[0].equation,
    parseFunction: optimizedRenderExplanation,
    RenderComponent: ({text}) => optimizedRenderExplanation(text),
    renderProps: { text: testCases[0].explanation },
    cache
  });

  // Generate report
  const report = benchmark.generateReport(preOptimization, postOptimization);
  
  console.log('Benchmark Report:');
  console.log('=================');
  console.log('Parsing Performance:');
  console.log(`- Mean time reduction: ${report.parsingImprovement.meanReduction}`);
  console.log(`- 95th percentile improvement: ${report.parsingImprovement.p95Reduction}`);
  
  console.log('\nRendering Performance:');
  console.log(`- FPS increase: ${report.renderingImprovement.fpsIncrease}`);
  console.log(`- Frame time reduction: ${report.renderingImprovement.frameTimeReduction}`);
  
  if (report.memoryImprovement) {
    console.log('\nMemory Usage:');
    console.log(`- Memory reduction: ${report.memoryImprovement.reduction}`);
  }
  
  if (report.cacheEffectiveness) {
    console.log('\nCache Performance:');
    console.log(`- Cache hit rate: ${report.cacheEffectiveness.hitRate}`);
  }

  return report;
}

export default runParserBenchmarks;
