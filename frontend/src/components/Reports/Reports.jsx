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
          <div className="p-6 flex-1 flex items-end justify-around gap-4 pt-12 relative">
            {/* Background grid lines */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="w-full border-t border-neutral-500"></div>
              <div className="w-full border-t border-neutral-500"></div>
              <div className="w-full border-t border-neutral-500"></div>
              <div className="w-full border-t border-neutral-500"></div>
            </div>

            {statusBreakdown.map((item, idx) => {
              const heightPct = (item.count / maxCount) * 100;
              let colorClass = 'bg-neutral-400';
              if(item.status === 'Available') colorClass = 'bg-status-success-bg border-status-success-text border-t-4 text-status-success-text';
              else if(item.status === 'Allocated') colorClass = 'bg-purple-100 border-purple-500 border-t-4 text-purple-700';
              else if(item.status === 'Maintenance') colorClass = 'bg-orange-100 border-orange-500 border-t-4 text-orange-700';
              else if(item.status === 'Lost' || item.status === 'Disposed') colorClass = 'bg-red-100 border-red-500 border-t-4 text-red-700';

              return (
                <div key={idx} className="flex flex-col items-center gap-2 group w-full max-w-[80px] z-10">
                  <div className="opacity-0 group-hover:opacity-100 font-bold transition-opacity bg-neutral-800 text-white text-xs px-2 py-1 rounded -mb-1">
                    {item.count}
                  </div>
                  <div 
                    className={`w-full rounded-t-sm transition-all duration-1000 ${colorClass}`}
                    style={{ height: `${heightPct}%`, minHeight: '10%' }}
                  ></div>
                  <div className="text-xs font-semibold text-neutral-text-secondary -rotate-45 origin-top-left mt-2 whitespace-nowrap">
                    {item.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Placeholder for Booking Heatmap */}
        <div className="bg-white border border-neutral-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-4 border-b border-neutral-border bg-neutral-surface flex items-center gap-2">
            <Calendar size={18} className="text-primary-600" />
            <h3 className="font-semibold text-neutral-text-primary">Booking Density Heatmap (30 Days)</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-2">
            <div className="flex-1 rounded-xl bg-gradient-to-br from-primary-50 to-neutral-50 border border-neutral-100 flex items-center justify-center p-6 text-center">
              <div>
                <Activity size={48} className="mx-auto mb-4 text-primary-300" />
                <p className="text-sm text-neutral-text-secondary font-medium">Insufficient booking data to generate a heatmap.</p>
                <p className="text-xs text-neutral-400 mt-2">Book more shared assets to see utilization patterns.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
