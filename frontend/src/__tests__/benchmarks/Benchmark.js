// AlgoVista Benchmarking Suite
import React from 'react';

class Benchmark {
  constructor() {
    this.results = {
      renderingTimes: [],
      memoryUsage: [],
      parseTime: [],
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  // Measure equation parsing performance
  async measureParsingPerformance(equation, parseFunction, iterations = 1000) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await parseFunction(equation);
      const end = performance.now();
      times.push(end - start);
    }

    return {
      mean: times.reduce((a, b) => a + b) / times.length,
      median: times.sort()[Math.floor(times.length / 2)],
      p95: times.sort()[Math.floor(times.length * 0.95)]
    };
  }

  // Measure rendering performance
  measureRenderPerformance(Component, props) {
    return new Promise((resolve) => {
      const measurements = [0];
      let frameCount = 0;
      const startTime = performance.now();

      const TestComponent = () => {
        React.useEffect(() => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            measurements.push(...entries.map(entry => entry.duration));
          });
          
          observer.observe({ entryTypes: ['measure'] });

          return () => observer.disconnect();
        }, []);

        return <Component {...props} />;
      };

      // Measure 60 frames (approximately 1 second of rendering)
      const rafCallback = () => {
        if (frameCount < 60) {
          performance.mark('render-start');
          // Force render
          frameCount++;
          performance.mark('render-end');
          performance.measure('render', 'render-start', 'render-end');
          requestAnimationFrame(rafCallback);
        } else {
          resolve({
            fps: frameCount / ((performance.now() - startTime) / 1000),
            averageFrameTime: measurements.reduce((a, b) => a + b) / measurements.length
          });
        }
      };

      requestAnimationFrame(rafCallback);
    });
  }

  // Measure memory usage (if available in the browser)
  async measureMemoryUsage(callback) {
    if ('memory' in performance) {
      const baselineMemory = performance.memory.usedJSHeapSize;
      await callback();
      const afterMemory = performance.memory.usedJSHeapSize;
      return afterMemory - baselineMemory;
    }
    
    // If performance.memory is not available (non-Chrome browsers)
    console.warn('Memory measurement not available in this environment');
    return null;
  }

  // Cache performance monitoring
  monitorCachePerformance(cacheKey, cache) {
    return {
      async get(key) {
        const result = await cache.get(key);
        if (result) {
          this.results.cacheHits++;
        } else {
          this.results.cacheMisses++;
        }
        return result;
      }
    };
  }

  // Run comprehensive benchmark suite
  async runBenchmarkSuite({
    equation,
    parseFunction,
    RenderComponent,
    renderProps,
    cache
  }) {
    // Initialize performance marks
    performance.clearMarks();
    performance.clearMeasures();

    // 1. Measure parsing performance
    const parsingResults = await this.measureParsingPerformance(
      equation,
      parseFunction
    );

    // 2. Measure rendering performance
    const renderingResults = await this.measureRenderPerformance(
      RenderComponent,
      renderProps
    );

    // 3. Measure memory usage
    const memoryUsage = await this.measureMemoryUsage(async () => {
      await parseFunction(equation);
    });

    // 4. Cache performance (if cache is provided)
    let cacheMetrics = null;
    if (cache) {
      const monitoredCache = this.monitorCachePerformance(equation, cache);
      // Run some cache operations here
      cacheMetrics = {
        hitRate: this.results.cacheHits / (this.results.cacheHits + this.results.cacheMisses)
      };
    }

    return {
      parsing: parsingResults,
      rendering: renderingResults,
      memory: memoryUsage,
      cache: cacheMetrics
    };
  }

  // Generate performance report
  generateReport(preOptimization, postOptimization) {
    return {
      parsingImprovement: {
        meanReduction: (
          ((preOptimization.parsing.mean - postOptimization.parsing.mean) /
            preOptimization.parsing.mean) *
          100
        ).toFixed(2) + '%',
        p95Reduction: (
          ((preOptimization.parsing.p95 - postOptimization.parsing.p95) /
            preOptimization.parsing.p95) *
          100
        ).toFixed(2) + '%'
      },
      renderingImprovement: {
        fpsIncrease: (
          ((postOptimization.rendering.fps - preOptimization.rendering.fps) /
            preOptimization.rendering.fps) *
          100
        ).toFixed(2) + '%',
        frameTimeReduction: (
          ((preOptimization.rendering.averageFrameTime -
            postOptimization.rendering.averageFrameTime) /
            preOptimization.rendering.averageFrameTime) *
          100
        ).toFixed(2) + '%'
      },
      memoryImprovement: (postOptimization.memory !== null && preOptimization.memory !== null) ? {
        reduction: (
          ((preOptimization.memory - postOptimization.memory) /
            preOptimization.memory) *
          100
        ).toFixed(2) + '%'
      } : {
        reduction: 'Not available'
      },
      cacheEffectiveness: postOptimization.cache
        ? {
            hitRate: (postOptimization.cache.hitRate * 100).toFixed(2) + '%'
          }
        : null
    };
  }
}

export { Benchmark };