import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, User, Wrench, Shield, ClipboardList, Clock } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export default function AssetDetail() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [statusLogs, setStatusLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  const token = localStorage.getItem('token');
  const { showToast } = useToast();

  useEffect(() => {
    const fetchAssetData = async () => {
      setLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [assetRes, allocRes, maintRes, logRes] = await Promise.all([
          fetch(`http://localhost:8000/api/assets/assets/${id}/`, { headers }),
          fetch(`http://localhost:8000/api/allocations/allocations/?asset=${id}`, { headers }),
          fetch(`http://localhost:8000/api/maintenance/requests/?asset=${id}`, { headers }),
          fetch(`http://localhost:8000/api/assets/status-logs/?asset=${id}`, { headers })
        ]);

        if (assetRes.ok) setAsset(await assetRes.json());
        if (allocRes.ok) setAllocations(await allocRes.json());
        if (maintRes.ok) setMaintenance(await maintRes.json());
        if (logRes.ok) setStatusLogs(await logRes.json());
      } catch (err) {
        showToast('Error fetching asset details.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAssetData();
  }, [id, token]);

  if (loading) {
    return <div className="text-neutral-text-secondary p-6">Loading asset details...</div>;
  }

  if (!asset) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-neutral-text-primary">Asset Not Found</h2>
        <Link to="/assets" className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold underline">
          <ArrowLeft size={16} /> Back to Assets Directory
        </Link>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-status-success-bg text-status-success-text';
      case 'Allocated': return 'bg-status-active-bg text-status-active-text';
      case 'Maintenance': return 'bg-status-pending-bg text-status-pending-text';
      case 'Disposed': return 'bg-neutral-200 text-neutral-600';
      default: return 'bg-status-danger-bg text-status-danger-text';
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-neutral-text-muted">
        <Link to="/assets" className="hover:text-primary-600 transition-colors">Assets Directory</Link>
        <ChevronRight size={12} />
        <span className="font-semibold text-neutral-text-secondary">{asset.tag}</span>
      </nav>

      {/* Back link */}
      <div>
        <Link to="/assets" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors">
          <ArrowLeft size={16} /> Back to Assets Directory
        </Link>
      </div>

      {/* Detail Card Header */}
      <div className="bg-white border border-neutral-border rounded-xl shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-medium text-neutral-text-primary bg-neutral-surface border border-neutral-border px-2 py-0.5 rounded text-sm">
              {asset.tag}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(asset.status)}`}>
              {asset.status}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-text-primary mt-2">{asset.name}</h2>
          {asset.description && <p className="text-neutral-text-secondary text-sm mt-1">{asset.description}</p>}
        </div>
        
        <div className="text-left md:text-right">
          <div className="text-xs text-neutral-text-secondary">Asset Category</div>
          <div className="font-semibold text-neutral-text-primary text-lg">{asset.category_name}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-neutral-border">
        {[
          { id: 'info', label: 'Technical Info', icon: Shield },
          { id: 'allocations', label: 'Allocations', icon: User },
          { id: 'maintenance', label: 'Maintenance', icon: Wrench },
          { id: 'logs', label: 'Audit Trail', icon: Clock }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-text-secondary hover:text-neutral-text-primary hover:border-neutral-border'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-neutral-border rounded-xl shadow-sm overflow-hidden p-6">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-text-secondary mb-3">General Metadata</h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-neutral-border/50">
                    <td className="py-2.5 text-neutral-text-secondary font-medium">Purchase Date</td>
                    <td className="py-2.5 text-neutral-text-primary text-right">{asset.purchase_date || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-neutral-text-secondary font-medium">Purchase Cost</td>
                    <td className="py-2.5 text-neutral-text-primary font-semibold text-right">
                      {asset.cost ? `$${parseFloat(asset.cost).toLocaleString(undefined, {minimumFractionDigits: 2})}` : 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-text-secondary mb-3">System Dates</h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-neutral-border/50">
                    <td className="py-2.5 text-neutral-text-secondary font-medium">Registered At</td>
                    <td className="py-2.5 text-neutral-text-primary text-right">{new Date(asset.created_at).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-neutral-text-secondary font-medium">Last Updated</td>
                    <td className="py-2.5 text-neutral-text-primary text-right">{new Date(asset.updated_at).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'allocations' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-text-secondary mb-3">Allocation History</h4>
            {allocations.length === 0 ? (
              <div className="text-center py-6 text-neutral-text-secondary text-sm">
                No allocation records found for this asset.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-surface border-b border-neutral-border">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold text-neutral-text-primary">Employee</th>
                      <th className="px-4 py-2.5 font-semibold text-neutral-text-primary">Allocation Date</th>
                      <th className="px-4 py-2.5 font-semibold text-neutral-text-primary">Return Date</th>
                      <th className="px-4 py-2.5 font-semibold text-neutral-text-primary">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-border">
                    {allocations.map(alloc => (
                      <tr key={alloc.id} className="hover:bg-neutral-bg/30">
                        <td className="px-4 py-3 text-neutral-text-primary font-medium">{alloc.employee_name}</td>
                        <td className="px-4 py-3 text-neutral-text-secondary">{new Date(alloc.allocated_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-neutral-text-secondary">
                          {alloc.returned_at ? new Date(alloc.returned_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            alloc.is_active ? 'bg-status-active-bg text-status-active-text' : 'bg-neutral-200 text-neutral-600'
                          }`}>
                            {alloc.is_active ? 'Active' : 'Returned'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-text-secondary mb-3">Maintenance Request History</h4>
            {maintenance.length === 0 ? (
              <div className="text-center py-6 text-neutral-text-secondary text-sm">
                No maintenance logs found for this asset.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-surface border-b border-neutral-border">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold text-neutral-text-primary">Description</th>
                      <th className="px-4 py-2.5 font-semibold text-neutral-text-primary">Priority</th>
                      <th className="px-4 py-2.5 font-semibold text-neutral-text-primary">Request Status</th>
                      <th className="px-4 py-2.5 font-semibold text-neutral-text-primary">Reported At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-border">
                    {maintenance.map(req => (
                      <tr key={req.id} className="hover:bg-neutral-bg/30">
                        <td className="px-4 py-3 text-neutral-text-primary font-medium truncate max-w-xs">{req.description}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            req.priority === 'Critical' ? 'bg-status-danger-bg text-status-danger-text' :
                            req.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-status-info-bg text-status-info-text'
                          }`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            req.status === 'Resolved' ? 'bg-status-success-bg text-status-success-text' :
                            req.status === 'Cancelled' ? 'bg-status-danger-bg text-status-danger-text' : 'bg-status-pending-bg text-status-pending-text'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-text-secondary">{new Date(req.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-text-secondary mb-3">Audit Logs & Status Trail</h4>
            {statusLogs.length === 0 ? (
              <div className="text-center py-6 text-neutral-text-secondary text-sm">
                No logs recorded.
              </div>
            ) : (
              <div className="flow-root animate-in fade-in duration-200">
                <ul className="-mb-8">
                  {statusLogs.map((log, logIdx) => (
                    <li key={log.id}>
                      <div className="relative pb-8">
                        {logIdx !== statusLogs.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-neutral-border" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center ring-8 ring-white">
                              <ClipboardList size={16} className="text-neutral-text-secondary" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-neutral-text-primary">
                                Status changed from <span className="font-semibold">{log.old_status || 'Empty'}</span> to{' '}
                                <span className="font-semibold text-primary-600">{log.new_status}</span>
                              </p>
                              {log.notes && <p className="text-xs text-neutral-text-secondary mt-1">{log.notes}</p>}
                            </div>
                            <div className="text-right text-xs whitespace-nowrap text-neutral-text-muted">
                              <time>{new Date(log.timestamp).toLocaleString()}</time>
                              <div className="font-medium text-neutral-text-secondary mt-0.5">by {log.changed_by_name}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
