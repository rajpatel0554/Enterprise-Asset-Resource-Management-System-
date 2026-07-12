import React, { useState, useEffect } from 'react';
import { PenTool, Plus, CheckCircle, Clock, Search, Wrench, XCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationModal from '../Shared/ConfirmationModal';

export default function Maintenance() {
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const { showToast } = useToast();
  const isAdminOrManager = currentUser?.role === 'Admin' || currentUser?.role === 'AssetManager';

  const [confirmCancel, setConfirmCancel] = useState(null); // holds req.id to cancel

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [reqRes, assetRes, userRes] = await Promise.all([
        fetch(`http://localhost:8000/api/maintenance/requests/`, { headers }),
        fetch(`http://localhost:8000/api/assets/assets/`, { headers }),
        isAdminOrManager ? fetch(`http://localhost:8000/api/users/`, { headers }) : Promise.resolve(null)
      ]);
      
      if (reqRes.ok) setRequests(await reqRes.json());
      if (assetRes.ok) setAssets(await assetRes.json());
      if (userRes && userRes.ok) setUsers(await userRes.json());
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8000/api/maintenance/requests/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset: selectedAsset,
          issue_description: description,
          priority: priority
        })
      });
      if (res.ok) {
        setShowForm(false);
        setSelectedAsset('');
        setDescription('');
        setPriority('Medium');
        showToast('Maintenance request submitted successfully!', 'success');
        fetchData();
      } else {
        showToast('Failed to submit request.', 'error');
      }
    } catch (err) {
      showToast('Error connecting to server.', 'error');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:8000/api/maintenance/requests/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchData();
      } else {
        showToast('Failed to update status.', 'error');
      }
    } catch (err) {
      showToast('Error connecting to server.', 'error');
    }
  };

  const getPriorityColor = (p) => {
    switch(p) {
      case 'Critical': return 'text-status-danger-text bg-status-danger-bg';
      case 'High': return 'text-orange-700 bg-orange-100';
      case 'Medium': return 'text-status-info-text bg-status-info-bg';
      case 'Low': return 'text-status-success-text bg-status-success-bg';
      default: return 'text-neutral-700 bg-neutral-200';
    }
  };

  const getStatusColor = (s) => {
    switch(s) {
      case 'Open': return 'border-status-info-text text-status-info-text';
      case 'In Progress': return 'border-status-warning-text text-status-warning-text';
      case 'Resolved': return 'border-status-success-text text-status-success-text';
      case 'Cancelled': return 'border-status-danger-text text-status-danger-text';
      default: return 'border-neutral-500 text-neutral-500';
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-neutral-text-primary">Maintenance Workflows</h2>
          <p className="text-neutral-text-secondary text-sm mt-1">Track asset repairs, servicing, and technical issues.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-neutral-text-secondary text-sm">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center text-neutral-text-secondary py-16 bg-white rounded-xl border border-neutral-border">
            <Wrench size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-neutral-text-primary text-sm">No maintenance requests</p>
            <p className="text-xs text-neutral-text-muted mt-1">No maintenance requests found. Click '+ Raise Request' to report an issue.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map(req => (
              <div key={req.id} className="bg-white border border-neutral-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">{req.asset_details.tag}</span>
                    <span className="font-semibold text-neutral-text-primary truncate">{req.asset_details.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getPriorityColor(req.priority)}`}>
                    {req.priority}
                  </span>
                </div>
                
                <div className="text-sm text-neutral-text-secondary mb-3 line-clamp-2 min-h-[40px]">
                  {req.issue_description}
                </div>

                <div className="flex flex-col gap-1 text-xs text-neutral-text-secondary mb-4">
                  <div>Reported by: <span className="font-medium text-neutral-text-primary">{req.reported_by_name}</span></div>
                  <div>Reported on: <span className="font-medium text-neutral-text-primary">{new Date(req.created_at).toLocaleDateString()}</span></div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-border/50">
                  <span className={`text-xs font-bold uppercase px-2 py-1 border rounded-full ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                  
                  {isAdminOrManager && req.status !== 'Resolved' && req.status !== 'Cancelled' && (
                    <div className="flex gap-2">
                      {req.status === 'Open' && (
                        <button onClick={() => updateStatus(req.id, 'In Progress')} className="text-status-warning-text hover:bg-status-warning-bg p-1.5 rounded transition-colors" title="Start Progress">
                          <Clock size={16} />
                        </button>
                      )}
                      {req.status === 'In Progress' && (
                        <button onClick={() => updateStatus(req.id, 'Resolved')} className="text-status-success-text hover:bg-status-success-bg p-1.5 rounded transition-colors" title="Mark Resolved">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button onClick={() => setConfirmCancel(req.id)} className="text-status-danger-text hover:bg-status-danger-bg p-1.5 rounded transition-colors" title="Cancel Request">
                        <XCircle size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmCancel !== null}
        danger
        title="Cancel Maintenance Request"
        message="Are you sure you want to cancel this maintenance request? This action cannot be undone."
        confirmLabel="Yes, Cancel Request"
        onCancel={() => setConfirmCancel(null)}
        onConfirm={() => {
          updateStatus(confirmCancel, 'Cancelled');
          setConfirmCancel(null);
        }}
      />

      {showForm && (
        <div className="fixed inset-0 bg-neutral-text-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-border flex justify-between items-center">
              <h3 className="font-bold text-lg text-neutral-text-primary">Raise Maintenance Request</h3>
              <button onClick={() => setShowForm(false)} className="text-neutral-text-muted hover:text-neutral-text-primary">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">Asset</label>
                <select 
                  required
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-border rounded-lg outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                >
                  <option value="" disabled>Select an asset</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.tag} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">Priority</label>
                <select 
                  required
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-border rounded-lg outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">Issue Description</label>
                <textarea 
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-border rounded-lg outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 resize-none"
                  placeholder="Describe the problem in detail..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 text-neutral-text-secondary font-medium hover:bg-neutral-surface rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAB */}
      <button 
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 hover:shadow-xl hover:-translate-y-1 transition-all z-40 font-semibold text-sm"
      >
        <Plus size={20} /> Raise Request
      </button>
    </div>
  );
}


