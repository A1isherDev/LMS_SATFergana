'use client';

import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface ProgressChartProps {
  data: DataPoint[];
  title?: string;
  type?: 'line' | 'bar' | 'area';
  height?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  maxValue?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
}

export default function ProgressChart({ 
  data, 
  title, 
  type = 'line', 
  height = 200,
  showGrid = true,
  showLabels = true,
  maxValue,
  unit = '',
  trend
}: ProgressChartProps) {
  const maxVal = maxValue || Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));
  const range = maxVal - minVal || 1;

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderChart = () => {
    if (type === 'bar') {
      return (
        <div className="flex items-end justify-between h-full px-2">
          {data.map((point, index) => {
            const height = (point.value / maxVal) * 100;
            const color = point.color || '#3B82F6';
            
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="relative w-full flex justify-center">
                  <div
                    className="w-8 rounded-t transition-all duration-300 hover:opacity-80"
                    style={{
                      height: `${height}%`,
                      backgroundColor: color,
                      minHeight: '4px'
                    }}
                  />
                  {showLabels && (
                    <span className="absolute -top-6 text-xs font-medium text-gray-700">
                      {point.value}{unit}
                    </span>
                  )}
                </div>
                {showLabels && (
                  <span className="text-xs text-gray-500 mt-2 text-center">
                    {point.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (type === 'area') {
      return (
        <div className="relative h-full">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {showGrid && (
              <g className="opacity-20">
                {[0, 25, 50, 75, 100].map((percent) => (
                  <line
                    key={percent}
                    x1="0"
                    y1={`${percent}%`}
                    x2="100%"
                    y2={`${percent}%`}
                    stroke="#9CA3AF"
                    strokeWidth="1"
                  />
                ))}
              </g>
            )}

            {/* Area */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            <path
              d={`M ${data.map((point, index) => {
                const x = (index / (data.length - 1)) * 400;
                const y = 200 - ((point.value - minVal) / range) * 200;
                return `${x},${y}`;
              }).join(' L ')} L 400,200 L 0,200 Z`}
              fill="url(#gradient)"
            />

            {/* Line */}
            <path
              d={`M ${data.map((point, index) => {
                const x = (index / (data.length - 1)) * 400;
                const y = 200 - ((point.value - minVal) / range) * 200;
                return `${x},${y}`;
              }).join(' L ')}`}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
            />

            {/* Data points */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 400;
              const y = 200 - ((point.value - minVal) / range) * 200;
              
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#3B82F6"
                    stroke="white"
                    strokeWidth="2"
                  />
                  {showLabels && (
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      className="text-xs font-medium fill-gray-700"
                    >
                      {point.value}{unit}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* X-axis labels */}
          {showLabels && (
            <div className="flex justify-between px-2 mt-2">
              {data.map((point, index) => (
                <span key={index} className="text-xs text-gray-500">
                  {point.label}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Default line chart
    return (
      <div className="relative h-full">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {showGrid && (
            <g className="opacity-20">
              {[0, 25, 50, 75, 100].map((percent) => (
                <line
                  key={percent}
                  x1="0"
                  y1={`${percent}%`}
                  x2="100%"
                  y2={`${percent}%`}
                  stroke="#9CA3AF"
                  strokeWidth="1"
                />
              ))}
            </g>
          )}

          {/* Line */}
          <path
            d={`M ${data.map((point, index) => {
              const x = (index / (data.length - 1)) * 400;
              const y = 200 - ((point.value - minVal) / range) * 200;
              return `${x},${y}`;
            }).join(' L ')}`}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
          />

          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 400;
            const y = 200 - ((point.value - minVal) / range) * 200;
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#3B82F6"
                  stroke="white"
                  strokeWidth="2"
                />
                {showLabels && (
                  <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    className="text-xs font-medium fill-gray-700"
                  >
                    {point.value}{unit}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* X-axis labels */}
        {showLabels && (
          <div className="flex justify-between px-2 mt-2">
            {data.map((point, index) => (
              <span key={index} className="text-xs text-gray-500">
                {point.label}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {trend && (
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className="text-sm text-gray-500">
              {trend === 'stable' ? 'No change' : `${trend}ward trend`}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height: `${height}px` }}>
        {data.length > 0 ? renderChart() : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {data.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>
            Min: {minVal}{unit} • Max: {maxVal}{unit}
          </span>
          <span>
            Average: {Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length)}{unit}
          </span>
        </div>
      )}
    </div>
  );
}
