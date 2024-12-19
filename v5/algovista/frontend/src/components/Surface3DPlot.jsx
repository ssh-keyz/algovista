import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Maximize2, Move3D, Plus, Minus } from 'lucide-react';

const getScale = (baseScale, viewportWidth, isDialog = false) => {
  const dialogScaleFactor = isDialog ? 1.5 : 1;
  return (baseScale * viewportWidth * dialogScaleFactor) / 800;
};

const getColor = (z) => {
  const maxZ = 50;
  const normalizedZ = Math.min(Math.max(z / maxZ, 0), 1);
  const hue = 240 - normalizedZ * 180;
  return `hsl(${hue}, 70%, 50%)`;
};

const DialogPlot = ({ 
  width, 
  height, 
  rotation, 
  generatePoints, 
  getColor,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchMove,
  onTouchEnd
}) => {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    const newPoints = generatePoints(true, width, height);
    if (newPoints) {
      setPoints(newPoints);
    }
  }, [width, height, rotation, generatePoints]);

  if (!points.length) return null;

  return (
    <svg 
      width={width} 
      height={height} 
      className="bg-gray-50 rounded-lg cursor-move"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
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
                strokeWidth="1.5"
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
                strokeWidth="1.5"
                opacity={0.7}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
};

const Surface3DPlot = ({ data }) => {
  const [rotation, setRotation] = useState({ x: 45, y: 45, z: 60 });
  const [customScale, setCustomScale] = useState(1.5);
  const [points, setPoints] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const dragRef = useRef({ isDragging: false, lastX: 0, lastY: 0 });
  const rafRef = useRef(null);
  
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

  const getAdjustedScale = useCallback((width, isDialog = false) => {
    const dialogScaleFactor = isDialog ? 1.5 : 1;
    return (baseScale * width * dialogScaleFactor * customScale) / 800;
  }, [customScale]);

  const fitToView = useCallback(() => {
    if (!data?.visualization_config?.ranges) return;
    
    const { ranges } = data.visualization_config;
    
    // Calculate the maximum extent of the surface
    const xRange = Math.abs(ranges.x[1] - ranges.x[0]);
    const yRange = Math.abs(ranges.y[1] - ranges.y[0]);
    const maxRange = Math.max(xRange, yRange);
    
    // Set rotation to match the visually appealing view
    setRotation({ x: 45, y: 45, z: 60 });
    
    // Calculate scale to fit the view, accounting for padding
    const containerWidth = dimensions.width || 800;
    const containerHeight = dimensions.height || 600;
    const minDimension = Math.min(containerWidth - 100, containerHeight - 100);
    
    // Adjust scale based on the maximum range
    const newScale = 4 / maxRange; // Increased scale for better visibility
    setCustomScale(newScale);
  }, [data, dimensions]);

  const handleZoom = useCallback((direction) => {
    setCustomScale(prev => {
      const change = direction === 'in' ? 1.25 : 0.8;
      return prev * change;
    });
  }, []);

  const transform3DTo2D = useCallback((x, y, z, width, height, isDialog = false) => {
    const radX = (rotation.x * Math.PI) / 180;
    const radY = (rotation.y * Math.PI) / 180;
    const radZ = (rotation.z * Math.PI) / 180;

    // First shift all coordinates to be positive
    const { ranges } = data.visualization_config;
    const xMin = ranges.x[0];
    const yMin = ranges.y[0];
    
    // Adjust coordinates so (0,0) is at bottom-left
    const xAdjusted = x - xMin;
    const yAdjusted = y - yMin;

    // Apply rotations
    let x1 = xAdjusted;
    let y1 = yAdjusted * Math.cos(radX) - z * Math.sin(radX);
    let z1 = yAdjusted * Math.sin(radX) + z * Math.cos(radX);

    let x2 = x1 * Math.cos(radY) + z1 * Math.sin(radY);
    let y2 = y1;
    let z2 = -x1 * Math.sin(radY) + z1 * Math.cos(radY);

    let x3 = x2 * Math.cos(radZ) - y2 * Math.sin(radZ);
    let y3 = x2 * Math.sin(radZ) + y2 * Math.cos(radZ);

    const scale = getAdjustedScale(width, isDialog);
    
    // Add padding to prevent clipping
    const padding = isDialog ? 100 : 50;
    
    return {
      x: padding + x3 * scale,
      y: height - (padding + y3 * scale), // Flip Y coordinate for SVG and add padding
      z: z2,
      originalZ: z
    };
  }, [rotation, getAdjustedScale, data]);

  const generatePoints = useCallback((isDialog = false, dialogWidth, dialogHeight) => {
    if (!data?.visualization_config?.ranges || !data?.visualization_config?.resolution) return null;

    const { ranges, resolution } = data.visualization_config;
    const newPoints = [];
    const width = isDialog ? dialogWidth : dimensions.width;
    const height = isDialog ? dialogHeight : dimensions.height;
    
    const xStep = (ranges.x[1] - ranges.x[0]) / resolution.x;
    const yStep = (ranges.y[1] - ranges.y[0]) / resolution.y;

    for (let x = ranges.x[0]; x <= ranges.x[1]; x += xStep) {
      const row = [];
      for (let y = ranges.y[0]; y <= ranges.y[1]; y += yStep) {
        const z = evaluateFunction(x, y);
        const transformed = transform3DTo2D(x, y, z, width, height, isDialog);
        row.push(transformed);
      }
      newPoints.push(row);
    }

    return newPoints;
  }, [data, dimensions.width, dimensions.height, transform3DTo2D]);

  useEffect(() => {
    if (!data) return;
    const newPoints = generatePoints(false);
    if (newPoints) {
      setPoints(newPoints);
    }
  }, [data, generatePoints]);

  const evaluateFunction = (x, y) => {
    try {
      return Math.pow(x, 2) + Math.pow(y, 2);
    } catch (error) {
      console.error('Error evaluating function:', error);
      return 0;
    }
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

  const handleDragStart = useCallback((e) => {
    const { clientX, clientY } = e.type === 'touchstart' ? e.touches[0] : e;
    dragRef.current = {
      isDragging: true,
      lastX: clientX,
      lastY: clientY
    };
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!dragRef.current.isDragging) return;
    
    const { clientX, clientY } = e.type === 'touchmove' ? e.touches[0] : e;
    const deltaX = clientX - dragRef.current.lastX;
    const deltaY = clientY - dragRef.current.lastY;
    
    // Cancel any existing animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    // Schedule the rotation update
    rafRef.current = requestAnimationFrame(() => {
      setRotation(prev => ({
        ...prev,
        y: (prev.y + deltaX * 0.5) % 360,
        x: Math.max(0, Math.min(180, prev.x + deltaY * 0.5))
      }));
    });
    
    dragRef.current.lastX = clientX;
    dragRef.current.lastY = clientY;
  }, []);

  const handleDragEnd = useCallback(() => {
    dragRef.current.isDragging = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  useEffect(() => {
    // Cleanup function to remove event listeners and cancel animations
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const MemoizedPlot = useMemo(() => {
    return ({ width, height }) => (
      <svg 
        width={width} 
        height={height} 
        className="bg-gray-50 rounded-lg cursor-move"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
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
  }, [points, handleDragStart, handleDragMove, handleDragEnd]);

  if (!data) {
    return <div>Loading...</div>;
  }

  const Controls = ({ isDialog }) => (
    <div className="space-y-4">
      {/* Rotation Controls */}
      <div className="w-full">
        {['x', 'y', 'z'].map(axis => (
          <div key={axis} className="flex items-center space-x-4 mb-2">
            <label className="w-24">{axis.toUpperCase()} Rotation:</label>
            <input
              type="range"
              min="0"
              max="360"
              value={rotation[axis]}
              onChange={(e) => handleRotationChange(axis, parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="w-12 text-right">{rotation[axis]}°</span>
          </div>
        ))}
      </div>
    </div>
  );

  const ViewControls = () => (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-lg border border-input">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-r-none"
          onClick={() => handleZoom('out')}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-l-none border-l"
          onClick={() => handleZoom('in')}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={fitToView}
        className="w-[130px]"
      >
        <Move3D className="h-4 w-4 mr-2" />
        Fit to View
      </Button>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>3D Surface Plot: {data.function?.raw || 'Loading...'}</CardTitle>
        <div className="flex items-center gap-2">
          <ViewControls />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl w-[90vw] h-[90vh] p-6">
              <DialogTitle className="text-xl font-semibold">
                3D Surface Plot: {data.function?.raw || 'Loading...'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Expanded view with interactive rotation controls
              </DialogDescription>
              <div className="flex flex-col h-[calc(100%-100px)] pt-4">
                <div className="flex items-center justify-between mb-4">
                  <Controls isDialog={true} />
                  <ViewControls />
                </div>
                <div className="flex-1 min-h-0 w-full">
                  <DialogPlot 
                    width={Math.min(1400, window.innerWidth * 0.85)}
                    height={Math.min(900, window.innerHeight * 0.7)}
                    rotation={rotation}
                    generatePoints={generatePoints}
                    getColor={getColor}
                    onMouseDown={handleDragStart}
                    onMouseMove={handleDragMove}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={handleDragStart}
                    onTouchMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent ref={containerRef} className="p-6">
        <Controls isDialog={false} />
        <div className="w-full aspect-[4/3]">
          <MemoizedPlot width={dimensions.width} height={dimensions.height} />
        </div>
        
        {data.mathematical_properties?.gradient && (
          <div className="mt-6 p-4 bg-gray-50 rounded">
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