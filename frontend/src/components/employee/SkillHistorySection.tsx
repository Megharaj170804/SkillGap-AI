import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from 'recharts';

interface Props {
  historyData: any; 
}

const SkillHistorySection: React.FC<Props> = ({ historyData }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'progress' | 'hours' | 'courses'>('timeline');
  const [visibleCount, setVisibleCount] = useState(10);

  if (!historyData) return null;

  const { timeline = [], skillProgressData = {}, weeklyHoursChart = [], completedResources = [] } = historyData;

  const timelineItems = timeline.slice(0, visibleCount);
  const totalHours = weeklyHoursChart.reduce((sum: number, w: any) => sum + w.hours, 0);
  const avgHours = weeklyHoursChart.length ? (totalHours / weeklyHoursChart.length).toFixed(1) : 0;

  // Format progress chart data
  const allDates = new Set<string>();
  const progressChartDataMap: any = {};
  
  Object.keys(skillProgressData).forEach(skill => {
    skillProgressData[skill].forEach((point: any) => {
      const dateStr = new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      allDates.add(dateStr);
      if (!progressChartDataMap[dateStr]) progressChartDataMap[dateStr] = { name: dateStr };
      progressChartDataMap[dateStr][skill] = point.level;
    });
  });

  const progressChartData = Array.from(allDates).map(date => progressChartDataMap[date]).sort((a, b) => new Date((a as any).name).getTime() - new Date((b as any).name).getTime());
  const skillNames = Object.keys(skillProgressData);
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

  const renderTabBtn = (id: typeof activeTab, label: string) => (
    <button 
      onClick={() => setActiveTab(id)}
      style={{
        padding: '0.6rem 1.2rem', background: activeTab === id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
        color: activeTab === id ? '#a5b4fc' : '#94a3b8', border: 'none', 
        borderBottom: `2px solid ${activeTab === id ? '#6366f1' : 'transparent'}`,
        cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', fontSize: '0.9rem'
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📊 My Learning History
      </h2>

      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
        {renderTabBtn('timeline', 'Activity Timeline')}
        {renderTabBtn('progress', 'Skill Progress')}
        {renderTabBtn('hours', 'Study Hours')}
        {renderTabBtn('courses', 'Completed Courses')}
      </div>

      {activeTab === 'timeline' && (
        <div>
          {timelineItems.length === 0 ? <p style={{ color: '#94a3b8' }}>No activity yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '1rem' }}>
              <div style={{ position: 'absolute', left: '15px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.1)' }} />
              {timelineItems.map((item: any) => {
                const isComplete = item.activityType === 'complete';
                const color = isComplete ? '#10b981' : '#3b82f6';
                return (
                  <div key={item._id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', position: 'relative' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, border: '2px solid #0f172a', position: 'absolute', left: '-5px', top: '4px' }} />
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', flex: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
                       <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
                         {new Date(item.date).toLocaleDateString()} — {item.hoursSpent}h
                       </div>
                       <div style={{ color: '#e2e8f0', fontWeight: 500 }}>
                         {isComplete ? `Completed resource for ${item.skillName}` : `Studied ${item.skillName}`}
                       </div>
                       {item.notes && <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>"{item.notes}"</div>}
                    </div>
                  </div>
                );
              })}
              {timeline.length > visibleCount && (
                <button onClick={() => setVisibleCount(v => v + 10)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', alignSelf: 'flex-start', marginLeft: '1.5rem' }}>
                  Load More...
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'progress' && (
        <div style={{ height: 300, width: '100%', padding: '1rem 0' }}>
           {progressChartData.length === 0 ? <p style={{ color: '#94a3b8' }}>Not enough data yet.</p> : (
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={progressChartData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                 <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickMargin={10} />
                 <YAxis stroke="#64748b" fontSize={12} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                 <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8, color: '#f8fafc' }} />
                 <Legend />
                 {skillNames.map((skill, index) => (
                   <Line key={skill} type="monotone" dataKey={skill} stroke={colors[index % colors.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                 ))}
               </LineChart>
             </ResponsiveContainer>
           )}
        </div>
      )}

      {activeTab === 'hours' && (
        <div>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 1.5rem', borderRadius: '12px', flex: '1 1 min-content' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total Hours (8 Weeks)</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6366f1' }}>{totalHours}h</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 1.5rem', borderRadius: '12px', flex: '1 1 min-content' }}>
               <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase' }}>Avg Hours/Week</div>
               <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{avgHours}h</div>
            </div>
          </div>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={weeklyHoursChart}>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                 <XAxis dataKey="week" stroke="#64748b" fontSize={12} tickMargin={10} />
                 <YAxis stroke="#64748b" fontSize={12} />
                 <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8 }} />
                 <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
               </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
            <div>Total Completed: <strong style={{ color: '#f8fafc' }}>{completedResources.length}</strong></div>
          </div>
          {completedResources.length === 0 ? <p style={{ color: '#94a3b8' }}>No resources completed yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {completedResources.map((res: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: '#f1f5f9', fontSize: '1rem' }}>{res.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{res.platform} • {res.skillName}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>✓ Done</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(res.completedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillHistorySection;
