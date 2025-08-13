import React from 'react';

interface RadarChartProps {
  data: {
    label: string;
    value: number; // 0-100
  }[];
  size?: number;
  showLabels?: boolean;
  showGrid?: boolean;
}

const RadarChart: React.FC<RadarChartProps> = ({ 
  data, 
  size = 300, 
  showLabels = true, 
  showGrid = true 
}) => {
  const center = size / 2;
  const maxRadius = (size * 0.8) / 2;
  const levels = 5;

  // Calculate points for each data point
  const getPoint = (index: number, value: number) => {
    const angle = (2 * Math.PI * index) / data.length - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y };
  };

  // Calculate label positions
  const getLabelPoint = (index: number) => {
    const angle = (2 * Math.PI * index) / data.length - Math.PI / 2;
    const labelRadius = maxRadius + 20;
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);
    return { x, y };
  };

  // Generate grid circles
  const gridCircles = Array.from({ length: levels }, (_, i) => {
    const radius = ((i + 1) / levels) * maxRadius;
    return (
      <circle
        key={i}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="1"
        opacity={0.3}
      />
    );
  });

  // Generate grid lines
  const gridLines = data.map((_, index) => {
    const angle = (2 * Math.PI * index) / data.length - Math.PI / 2;
    const endX = center + maxRadius * Math.cos(angle);
    const endY = center + maxRadius * Math.sin(angle);
    return (
      <line
        key={index}
        x1={center}
        y1={center}
        x2={endX}
        y2={endY}
        stroke="#e5e7eb"
        strokeWidth="1"
        opacity={0.3}
      />
    );
  });

  // Generate data path
  const dataPoints = data.map((item, index) => getPoint(index, item.value));
  const pathData = dataPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ') + ' Z';

  // Generate value labels
  const valueLabels = data.map((item, index) => {
    const point = getPoint(index, item.value);
    return (
      <g key={`value-${index}`}>
        <circle
          cx={point.x}
          cy={point.y}
          r="4"
          fill="#000000"
          stroke="#ffffff"
          strokeWidth="2"
        />
        <text
          x={point.x}
          y={point.y - 10}
          textAnchor="middle"
          className="text-xs font-semibold fill-black"
        >
          {item.value}%
        </text>
      </g>
    );
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid */}
        {showGrid && (
          <g>
            {gridCircles}
            {gridLines}
          </g>
        )}
        
        {/* Data area */}
        <path
          d={pathData}
          fill="rgba(0, 0, 0, 0.1)"
          stroke="#000000"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {valueLabels}
        
        {/* Labels */}
        {showLabels && data.map((item, index) => {
          const labelPoint = getLabelPoint(index);
          return (
            <text
              key={`label-${index}`}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm font-medium fill-gray-700"
            >
              {item.label}
            </text>
          );
        })}
        
        {/* Center point */}
        <circle
          cx={center}
          cy={center}
          r="2"
          fill="#000000"
        />
      </svg>
    </div>
  );
};

export default RadarChart;
