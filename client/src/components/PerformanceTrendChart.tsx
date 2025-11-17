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

  // Add timestamps to the data and handle multiple sessions on the same day
  const chartData = (data || defaultData).map((item, index, array) => {
    const baseTimestamp = new Date(item.date).getTime();
    
    // Check if there are other sessions on the same date
    const sameDateSessions = array.filter(d => d.date === item.date);
    
    if (sameDateSessions.length > 1) {
      // Find the index of this session among sessions on the same date
      const sameDateIndex = sameDateSessions.findIndex(d => d.sessionNumber === item.sessionNumber);
      // Add small offset (1 hour per session) to spread points horizontally
      const offset = sameDateIndex * (60 * 60 * 1000); // 1 hour in milliseconds
      return {
        ...item,
        timestamp: baseTimestamp + offset
      };
    }
    
    return {
      ...item,
      timestamp: baseTimestamp
    };
  });

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

  // Format date for x-axis in "Mon YY" format
  const formatXAxisDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: '2-digit' 
    });
  };

  // Generate unique ticks to avoid duplicate month labels
  const getUniqueTicks = () => {
    const seen = new Set<string>();
    const uniqueTicks: number[] = [];
    
    chartData.forEach((item) => {
      const label = formatXAxisDate(item.timestamp);
      if (!seen.has(label)) {
        seen.add(label);
        uniqueTicks.push(item.timestamp);
      }
    });
    
    return uniqueTicks;
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
            ticks={getUniqueTicks()}
            tickFormatter={formatXAxisDate}
            stroke="#6b7280"
            fontSize={12}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
            label={{ value: 'Date (Mon YY)', fontSize: '12px'}}
            textAnchor="middle"
            height={60}
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
