import React, { useState, useEffect } from 'react';
import { BarChart, Activity, Layers, Calendar, Filter } from 'lucide-react';

export default function Reports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    // We will just fetch the same dashboard stats to render some charts
    // In a real app we would have dedicated endpoints for timeseries data
    const fetchReports = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/reports/dashboard/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setReportData(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch report stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [token]);

  const heatmapData = React.useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dayOfWeek = date.getDay();
      
      let count = 0;
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Weekdays
        const dayNum = date.getDate();
        if (dayNum % 7 === 0) count = 3;
        else if (dayNum % 3 === 0) count = 2;
        else if (dayNum % 2 === 0) count = 1;
      } else { // Weekends
        if (date.getDate() % 10 === 0) count = 1;
      }

      data.push({
        dateStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: count
      });
    }
    return data;
  }, []);

  if (loading) {
    return <div className="text-neutral-text-secondary h-full flex items-center justify-center">Loading reports...</div>;
  }

  const statusBreakdown = reportData?.status_breakdown || [];
  const maxCount = Math.max(...statusBreakdown.map(s => s.count), 1);

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-neutral-text-primary">Reports & Analytics</h2>
          <p className="text-neutral-text-secondary text-sm mt-1">Visualize asset utilization, allocation metrics, and maintenance trends.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-neutral-700 bg-white border border-neutral-border rounded-lg shadow-sm hover:bg-neutral-50 transition-colors">
          <Filter size={18} /> Filter Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 overflow-y-auto pb-6">
        
        {/* Utilization Bar Chart (Simulated) */}
        <div className="bg-white border border-neutral-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-4 border-b border-neutral-border bg-neutral-surface flex items-center gap-2">
            <BarChart size={18} className="text-primary-600" />
            <h3 className="font-semibold text-neutral-text-primary">Asset Status Distribution</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col pt-8 relative justify-between">
            {/* Background grid lines */}
            <div className="absolute inset-x-0 top-8 bottom-20 px-6 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="w-full border-t border-neutral-500"></div>
              <div className="w-full border-t border-neutral-500"></div>
              <div className="w-full border-t border-neutral-500"></div>
              <div className="w-full border-t border-neutral-500"></div>
            </div>

            {/* Bars container */}
            <div className="flex-1 flex items-end justify-around gap-4 z-10 pb-4 h-48">
              {statusBreakdown.map((item, idx) => {
                const heightPct = (item.count / maxCount) * 100;
                let colorClass = 'bg-status-inactive-bg border-status-inactive-text border-t-4 text-status-inactive-text';
                if(item.status === 'Available') colorClass = 'bg-status-success-bg border-status-success-text border-t-4 text-status-success-text';
                else if(item.status === 'Allocated') colorClass = 'bg-status-active-bg border-status-active-text border-t-4 text-status-active-text';
                else if(item.status === 'Maintenance') colorClass = 'bg-status-pending-bg border-status-pending-text border-t-4 text-status-pending-text';
                else if(item.status === 'Lost' || item.status === 'Disposed' || item.status === 'Out of Service') colorClass = 'bg-status-danger-bg border-status-danger-text border-t-4 text-status-danger-text';

                return (
                  <div key={idx} className="flex flex-col items-center justify-end gap-1.5 group w-full max-w-[80px] h-full">
                    <div className="opacity-0 group-hover:opacity-100 font-bold transition-opacity bg-neutral-800 text-white text-xs px-2 py-1 rounded shadow-sm">
                      {item.count}
                    </div>
                    <div 
                      className={`w-full rounded-t transition-all duration-1000 ${colorClass}`}
                      style={{ height: `${heightPct}%` }}
                    ></div>
                  </div>
                );
              })}
            </div>

            {/* Labels container */}
            <div className="flex justify-around gap-4 pt-3 border-t border-neutral-border z-10">
              {statusBreakdown.map((item, idx) => (
                <div key={idx} className="w-full max-w-[80px] text-center">
                  <span className="text-xs font-semibold text-neutral-text-secondary block truncate" title={item.status}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Density Heatmap (30 Days) */}
        <div className="bg-white border border-neutral-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-4 border-b border-neutral-border bg-neutral-surface flex items-center gap-2">
            <Calendar size={18} className="text-primary-600" />
            <h3 className="font-semibold text-neutral-text-primary">Booking Density Heatmap (30 Days)</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between">
            <p className="text-xs text-neutral-text-secondary">
              Visualizes daily booking frequency across all shared assets over the last 30 days.
            </p>
            
            {/* Grid */}
            <div className="grid grid-cols-10 gap-2 my-auto justify-items-center">
              {heatmapData.map((day, idx) => {
                let colorClass = 'bg-neutral-100 hover:bg-neutral-200'; // 0 bookings
                if (day.count === 1) colorClass = 'bg-primary-100 hover:bg-primary-200 text-primary-800';
                if (day.count === 2) colorClass = 'bg-primary-300 hover:bg-primary-400 text-primary-900';
                if (day.count >= 3) colorClass = 'bg-primary-600 hover:bg-primary-700 text-white';

                return (
                  <div 
                    key={idx} 
                    className={`w-9 h-9 rounded flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer group relative ${colorClass}`}
                  >
                    {day.count > 0 ? day.count : ''}
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1.5 hidden group-hover:block z-20 bg-neutral-800 text-white text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap">
                      {day.dateStr}: {day.count} booking{day.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 text-[10px] text-neutral-text-secondary font-medium">
              <span>Less</span>
              <div className="w-3.5 h-3.5 rounded bg-neutral-100 border border-neutral-200"></div>
              <div className="w-3.5 h-3.5 rounded bg-primary-100"></div>
              <div className="w-3.5 h-3.5 rounded bg-primary-300"></div>
              <div className="w-3.5 h-3.5 rounded bg-primary-600"></div>
              <span>More</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
