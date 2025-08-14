import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PerformanceData {
  date: string;
  overallScore: number;
  sessionNumber: number;
  timestamp?: number;
}

interface PerformanceTrendChartProps {
  data?: PerformanceData[];
}

const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({ data }) => {
  // Default data if none provided
  const defaultData: PerformanceData[] = [
    { date: '2024-01-08', overallScore: 75, sessionNumber: 1 },
    { date: '2024-01-15', overallScore: 65, sessionNumber: 2 },
    { date: '2024-01-18', overallScore: 88, sessionNumber: 3 },
    { date: '2024-02-22', overallScore: 71, sessionNumber: 4 },
    { date: '2024-03-25', overallScore: 54, sessionNumber: 5 },
    { date: '2024-06-28', overallScore: 76, sessionNumber: 6 },
    { date: '2024-07-01', overallScore: 78, sessionNumber: 7 },
    { date: '2024-08-05', overallScore: 90, sessionNumber: 8 },
  ];

  // Add timestamps to the data
  const chartData = (data || defaultData).map(item => ({
    ...item,
    timestamp: new Date(item.date).getTime()
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-black">
            Session {data.sessionNumber}
          </p>
          <p className="text-sm text-gray-600">
            {new Date(data.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-sm font-semibold text-black">
            Overall Score: {data.overallScore}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Format date for x-axis with dynamic intervals
  const formatXAxisDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const dataRange = Math.max(...chartData.map(d => d.timestamp)) - Math.min(...chartData.map(d => d.timestamp));
    const daysDiff = dataRange / (1000 * 60 * 60 * 24);
    
    // Dynamic formatting based on date range
    if (daysDiff > 180) { // More than 6 months
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: '2-digit' 
      });
    } else if (daysDiff > 60) { // More than 2 months
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } else { // Less than 2 months
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Calculate proper tick interval
  const getTickInterval = () => {
    const dataRange = Math.max(...chartData.map(d => d.timestamp)) - Math.min(...chartData.map(d => d.timestamp));
    const daysDiff = dataRange / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 180) { // More than 6 months, show every other point
      return Math.ceil(chartData.length / 4);
    } else if (daysDiff > 60) { // More than 2 months, show most points
      return Math.ceil(chartData.length / 6);
    } else { // Less than 2 months, show all points
      return 0;
    }
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#f3f4f6" 
            horizontal={true}
            vertical={false}
          />
          <XAxis 
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatXAxisDate}
            stroke="#6b7280"
            fontSize={12}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
            label={{ value: 'Date (Mon YY)', fontSize: '12px'}}
            textAnchor="middle"
            height={60}
            interval={getTickInterval()}
            minTickGap={50}
          />
          <YAxis 
            domain={[0, 100]}
            stroke="#6b7280"
            fontSize={12}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
            label={{ 
              value: 'Performance Score (%)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="overallScore" 
            stroke="#000000" 
            strokeWidth={2}
            dot={{ 
              fill: '#000000', 
              strokeWidth: 2, 
              r: 4,
              stroke: '#ffffff'
            }}
            activeDot={{ 
              r: 6, 
              fill: '#000000',
              stroke: '#ffffff',
              strokeWidth: 2
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceTrendChart;
