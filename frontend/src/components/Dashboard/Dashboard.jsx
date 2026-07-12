import React, { useState, useEffect } from 'react';
import { Package, ArrowRightLeft, Wrench, FileCheck, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/reports/dashboard/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-neutral-text-secondary">Loading dashboard...</div>
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const statusData = stats?.status_breakdown || [];

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-neutral-text-primary">Welcome back, {currentUser?.first_name || 'User'}!</h2>
        <p className="text-neutral-text-secondary text-sm mt-1">Here's what's happening with your assets today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-text-secondary">Total Assets</div>
            <div className="text-2xl font-bold text-neutral-text-primary">{kpis.total_assets || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-text-secondary">Available</div>
            <div className="text-2xl font-bold text-neutral-text-primary">{kpis.available_assets || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-text-secondary">Allocated</div>
            <div className="text-2xl font-bold text-neutral-text-primary">{kpis.allocated_assets || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Wrench size={24} />
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-text-secondary">In Maintenance</div>
            <div className="text-2xl font-bold text-neutral-text-primary">{kpis.maintenance_assets || 0}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-neutral-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-border bg-neutral-surface flex items-center justify-between">
              <h3 className="font-semibold text-neutral-text-primary flex items-center gap-2">
                <AlertTriangle size={18} className="text-status-warning-text" /> 
                Action Required
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {kpis.pending_transfers > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-900">Pending Transfers</p>
                      <p className="text-xs text-orange-700">{kpis.pending_transfers} transfers awaiting approval.</p>
                    </div>
                  </div>
                  <button onClick={() => navigate('/allocations')} className="text-sm font-medium text-orange-700 hover:text-orange-800 bg-white px-3 py-1.5 rounded-md shadow-sm border border-orange-200">
                    Review
                  </button>
                </div>
              )}
              
              {kpis.open_maintenance > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                      <Wrench size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-900">Open Maintenance Requests</p>
                      <p className="text-xs text-red-700">{kpis.open_maintenance} requests need attention.</p>
                    </div>
                  </div>
                  <button onClick={() => navigate('/maintenance')} className="text-sm font-medium text-red-700 hover:text-red-800 bg-white px-3 py-1.5 rounded-md shadow-sm border border-red-200">
                    View
                  </button>
                </div>
              )}

              {kpis.active_audits > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <FileCheck size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Active Audits</p>
                      <p className="text-xs text-blue-700">{kpis.active_audits} audit cycles currently in progress.</p>
                    </div>
                  </div>
                  <button onClick={() => navigate('/audits')} className="text-sm font-medium text-blue-700 hover:text-blue-800 bg-white px-3 py-1.5 rounded-md shadow-sm border border-blue-200">
                    Audit
                  </button>
                </div>
              )}

              {kpis.pending_transfers === 0 && kpis.open_maintenance === 0 && kpis.active_audits === 0 && (
                <div className="text-center py-6 text-neutral-text-secondary text-sm">
                  <CheckCircle size={32} className="mx-auto mb-2 text-status-success-text opacity-50" />
                  No urgent actions required. You're all caught up!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links / Status Breakdown */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-neutral-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-border bg-neutral-surface">
              <h3 className="font-semibold text-neutral-text-primary">Asset Status Breakdown</h3>
            </div>
            <div className="p-4 space-y-4">
              {statusData.map((item, idx) => {
                const pct = Math.round((item.count / (kpis.total_assets || 1)) * 100);
                let colorClass = 'bg-neutral-500';
                if(item.status === 'Available') colorClass = 'bg-status-success-text';
                else if(item.status === 'Allocated') colorClass = 'bg-purple-500';
                else if(item.status === 'Maintenance') colorClass = 'bg-orange-500';
                else if(item.status === 'Lost') colorClass = 'bg-status-danger-text';

                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-neutral-text-secondary">{item.status}</span>
                      <span className="font-bold text-neutral-text-primary">{item.count}</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div className={`${colorClass} h-2 rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
