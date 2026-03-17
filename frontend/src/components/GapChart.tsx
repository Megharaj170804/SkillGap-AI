import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface GapChartProps {
  gapScore: number;
  size?: number;
}

const GapChart: React.FC<GapChartProps> = ({ gapScore, size = 160 }) => {
  const data = [
    { name: 'Ready', value: gapScore },
    { name: 'Gap', value: 100 - gapScore },
  ];

  const color = gapScore >= 70 ? '#10b981' : gapScore >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.32}
            outerRadius={size * 0.46}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={color} />
            <Cell fill="rgba(255,255,255,0.06)" />
          </Pie>
          <Tooltip formatter={(value: unknown) => [`${value}%`, '']} contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#f1f5f9' }} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: size > 120 ? '1.4rem' : '1.1rem', fontWeight: 800, color }}>{gapScore}%</div>
        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>Ready</div>
      </div>
    </div>
  );
};

export default GapChart;
