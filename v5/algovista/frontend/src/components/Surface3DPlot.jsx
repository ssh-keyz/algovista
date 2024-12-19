import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Maximize2 } from 'lucide-react';

const Surface3DPlot = ({ data }) => {
  const [rotation, setRotation] = useState({ x: 45, y: 45, z: 30 });
  const [points, setPoints] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  
  // Base scale factor - will be adjusted based on container size
  const baseScale = 40;

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: width - 32, // Account for padding
          height: Math.min(height, width * 0.75) // Maintain aspect ratio
        });
      }
    };

    updateDimensions();
    
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []); // Only run once on mount

  useEffect(() => {
    if (!data) return;
    generatePoints();
  }, [data, rotation]); // Only regenerate points when data or rotation changes

  const getScale = (viewportWidth) => {
    return (baseScale * viewportWidth) / 800; // Scale relative to original 800px width
  };

  const generatePoints = () => {
    if (!data?.visualization_config?.ranges || !data?.visualization_config?.resolution) return;

    const { ranges, resolution } = data.visualization_config;
    const newPoints = [];
    
    const xStep = (ranges.x[1] - ranges.x[0]) / resolution.x;
    const yStep = (ranges.y[1] - ranges.y[0]) / resolution.y;

    // Generate grid points
    for (let x = ranges.x[0]; x <= ranges.x[1]; x += xStep) {
      const row = [];
      for (let y = ranges.y[0]; y <= ranges.y[1]; y += yStep) {
        const z = evaluateFunction(x, y);
        const transformed = transform3DTo2D(x, y, z, dimensions.width, dimensions.height);
        row.push(transformed);
      }
      newPoints.push(row);
    }

    setPoints(newPoints);
  };

  const evaluateFunction = (x, y) => {
    try {
      return Math.pow(x, 2) + Math.pow(y, 2);
    } catch (error) {
      console.error('Error evaluating function:', error);
      return 0;
    }
  };

  const transform3DTo2D = useCallback((x, y, z, width, height) => {
    const radX = (rotation.x * Math.PI) / 180;
    const radY = (rotation.y * Math.PI) / 180;
    const radZ = (rotation.z * Math.PI) / 180;

    // Apply 3D rotations
    let x1 = x;
    let y1 = y * Math.cos(radX) - z * Math.sin(radX);
    let z1 = y * Math.sin(radX) + z * Math.cos(radX);

    let x2 = x1 * Math.cos(radY) + z1 * Math.sin(radY);
    let y2 = y1;
    let z2 = -x1 * Math.sin(radY) + z1 * Math.cos(radY);

    // Apply Z rotation
    let x3 = x2 * Math.cos(radZ) - y2 * Math.sin(radZ);
    let y3 = x2 * Math.sin(radZ) + y2 * Math.cos(radZ);

    // Project to 2D
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = getScale(width);
    
    return {
      x: centerX + x3 * scale,
      y: centerY + y3 * scale,
      z: z2,
      originalZ: z
    };
  }, [rotation]);

  const getColor = (z) => {
    const maxZ = 50;
    const normalizedZ = Math.min(Math.max(z / maxZ, 0), 1);
    const hue = 240 - normalizedZ * 180;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const handleRotationChange = (axis, value) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setRotation(prev => ({
        ...prev,
        [axis]: value
      }));
    }, 50); // 50ms debounce
  };

  const MemoizedPlot = useMemo(() => {
    return ({ width, height }) => (
      <svg width={width} height={height} className="bg-gray-50 rounded-lg">
        {points.map((row, i) => (
          <g key={`x-${i}`}>
            {row.slice(1).map((point, j) => {
              const prev = row[j];
              return (
                <line
                  key={`x-${i}-${j}`}
                  x1={prev.x}
                  y1={prev.y}
                  x2={point.x}
                  y2={point.y}
                  stroke={getColor(point.originalZ)}
                  strokeWidth="1"
                  opacity={0.7}
                />
              );
            })}
          </g>
        ))}

        {points[0]?.map((_, colIndex) => (
          <g key={`y-${colIndex}`}>
            {points.slice(1).map((row, i) => {
              const prev = points[i][colIndex];
              const point = row[colIndex];
              return (
                <line
                  key={`y-${colIndex}-${i}`}
                  x1={prev.x}
                  y1={prev.y}
                  x2={point.x}
                  y2={point.y}
                  stroke={getColor(point.originalZ)}
                  strokeWidth="1"
                  opacity={0.7}
                />
              );
            })}
          </g>
        ))}
      </svg>
    );
  }, [points]);

  if (!data) {
    return <div>Loading...</div>;
  }

  const Controls = () => (
    <div className="mb-4 space-y-2">
      {['x', 'y', 'z'].map(axis => (
        <div key={axis} className="flex items-center space-x-4">
          <label className="w-24">{axis.toUpperCase()} Rotation:</label>
          <input
            type="range"
            min="0"
            max="360"
            value={rotation[axis]}
            onChange={(e) => handleRotationChange(axis, parseInt(e.target.value))}
            className="w-48"
          />
          <span>{rotation[axis]}°</span>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>3D Surface Plot: {data.function?.raw || 'Loading...'}</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-7xl w-[90vw]">
            <DialogTitle>
              3D Surface Plot: {data.function?.raw || 'Loading...'}
            </DialogTitle>
            <DialogDescription>
              Expanded view with interactive rotation controls
            </DialogDescription>
            <div className="space-y-4">
              <Controls />
              <MemoizedPlot width={Math.min(1200, window.innerWidth * 0.8)} height={Math.min(900, window.innerHeight * 0.6)} />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent ref={containerRef}>
        <Controls />
        <MemoizedPlot width={dimensions.width} height={dimensions.height} />
        
        {/* Display mathematical properties if available */}
        {data.mathematical_properties?.gradient && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">Gradient:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>∂f/∂x = {data.mathematical_properties.gradient.dx}</div>
              <div>∂f/∂y = {data.mathematical_properties.gradient.dy}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Surface3DPlot;