import React, { useState, useEffect } from 'react';
import { Package, Send, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';

export default function Allocations() {
  const [activeAllocations, setActiveAllocations] = useState([]);
  const [transferRequests, setTransferRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Transfer Form State
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [toEmployeeId, setToEmployeeId] = useState('');
  const [reason, setReason] = useState('');

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user'));

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [allocRes, transferRes, userRes] = await Promise.all([
        fetch(`http://localhost:8000/api/allocations/allocations/?employee=${currentUser.id}&is_active=true`, { headers }),
        fetch(`http://localhost:8000/api/allocations/transfers/`, { headers }),
        fetch(`http://localhost:8000/api/users/`, { headers })
      ]);
      
      if (allocRes.ok) setActiveAllocations(await allocRes.json());
      if (transferRes.ok) {
        const transfers = await transferRes.json();
        const isAdminOrManager = currentUser.role === 'Admin' || currentUser.role === 'AssetManager';
        if (isAdminOrManager) {
          setTransferRequests(transfers);
        } else {
          setTransferRequests(transfers.filter(t => t.from_employee === currentUser.id || t.to_employee === currentUser.id));
        }
      }
      if (userRes.ok) setUsers(await userRes.json());
    } catch (err) {
      console.error('Failed to fetch allocations data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInitiateTransfer = (allocation) => {
    setSelectedAsset(allocation.asset_details);
    setShowTransferForm(true);
  };

  const submitTransfer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8000/api/allocations/transfers/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset: selectedAsset.id,
          from_employee: currentUser.id,
          to_employee: toEmployeeId,
          reason: reason
        })
      });
      if (res.ok) {
        setShowTransferForm(false);
        setReason('');
        setToEmployeeId('');
        fetchData();
      } else {
        alert('Failed to submit transfer request.');
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
  };

  const respondToTransfer = async (transferId, action) => {
    try {
      const res = await fetch(`http://localhost:8000/api/allocations/transfers/${transferId}/${action}/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        alert(`Failed to ${action} transfer.`);
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-neutral-text-primary">My Allocations & Transfers</h2>
          <p className="text-neutral-text-secondary text-sm mt-1">View assets currently assigned to you and manage transfers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* My Assets */}
        <div className="bg-white border border-neutral-border rounded-xl shadow-sm flex flex-col">
          <div className="p-4 border-b border-neutral-border bg-neutral-surface">
            <h3 className="font-semibold text-neutral-text-primary">Assets Assigned to Me</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-neutral-text-secondary text-sm">Loading...</div>
            ) : activeAllocations.length === 0 ? (
              <div className="text-center text-neutral-text-secondary py-8">
                <Package size={32} className="mx-auto mb-3 opacity-50" />
                <p>You have no active asset allocations.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeAllocations.map(alloc => (
                  <div key={alloc.id} className="border border-neutral-border rounded-lg p-4 flex justify-between items-center hover:border-primary-300 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">{alloc.asset_details.tag}</span>
                        <span className="font-semibold text-neutral-text-primary">{alloc.asset_details.name}</span>
                      </div>
                      <div className="text-xs text-neutral-text-secondary mt-1">Allocated on: {new Date(alloc.allocated_at).toLocaleDateString()}</div>
                    </div>
                    <button 
                      onClick={() => handleInitiateTransfer(alloc)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-1"
                    >
                      <Send size={14} /> Transfer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transfer Requests */}
        <div className="bg-white border border-neutral-border rounded-xl shadow-sm flex flex-col">
          <div className="p-4 border-b border-neutral-border bg-neutral-surface">
            <h3 className="font-semibold text-neutral-text-primary">Transfer Requests</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-neutral-text-secondary text-sm">Loading...</div>
            ) : transferRequests.length === 0 ? (
              <div className="text-center text-neutral-text-secondary py-8">
                <ArrowRightLeft size={32} className="mx-auto mb-3 opacity-50" />
                <p>No active transfer requests.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transferRequests.map(req => {
                  const isIncoming = req.to_employee === currentUser.id;
                  const isPending = req.status === 'Pending';
                  return (
                    <div key={req.id} className={`border rounded-lg p-4 ${isPending ? 'border-primary-200 bg-primary-50' : 'border-neutral-border'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isIncoming ? 'bg-status-info-bg text-status-info-text' : 'bg-neutral-200 text-neutral-700'}`}>
                            {isIncoming ? 'Incoming' : 'Outgoing'}
                          </span>
                          <span className={`ml-2 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded
                            ${req.status === 'Approved' ? 'bg-status-success-bg text-status-success-text' : 
                              req.status === 'Rejected' ? 'bg-status-danger-bg text-status-danger-text' : 'bg-status-warning-bg text-status-warning-text'}`}>
                            {req.status}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-text-secondary">{new Date(req.request_date).toLocaleDateString()}</div>
                      </div>
                      
                      <div className="font-semibold text-neutral-text-primary mt-2">
                        {req.asset_details.tag} - {req.asset_details.name}
                      </div>
                      <div className="text-sm text-neutral-text-secondary mt-1">
                        {isIncoming ? `From: ${req.from_employee_name}` : `To: ${req.to_employee_name}`}
                      </div>
                      <div className="text-sm italic text-neutral-600 mt-2 bg-white/50 p-2 rounded">
                        "{req.reason}"
                      </div>

                      {/* Action Buttons for Managers/Admins or receivers */}
                      {isPending && (currentUser.role === 'Admin' || currentUser.role === 'AssetManager' || isIncoming) && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-neutral-border/50">
                          <button 
                            onClick={() => respondToTransfer(req.id, 'approve')}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-1.5 rounded text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                          >
                            <CheckCircle size={16} /> Approve
                          </button>
                          <button 
                            onClick={() => respondToTransfer(req.id, 'reject')}
                            className="flex-1 bg-white border border-neutral-border hover:bg-neutral-50 text-status-danger-text py-1.5 rounded text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                          >
                            <XCircle size={16} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Form Modal */}
      {showTransferForm && (
        <div className="fixed inset-0 bg-neutral-text-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-border flex justify-between items-center">
              <h3 className="font-bold text-lg text-neutral-text-primary">Request Transfer</h3>
              <button onClick={() => setShowTransferForm(false)} className="text-neutral-text-muted hover:text-neutral-text-primary">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={submitTransfer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">Asset</label>
                <div className="font-medium text-neutral-text-primary bg-neutral-surface px-3 py-2 rounded-lg border border-neutral-border">
                  {selectedAsset?.tag} - {selectedAsset?.name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">Transfer To (Employee)</label>
                <select 
                  required
                  value={toEmployeeId}
                  onChange={(e) => setToEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-border rounded-lg outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                >
                  <option value="" disabled>Select an employee</option>
                  {users.filter(u => u.id !== currentUser.id).map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.department_name || 'No Dept'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">Reason for Transfer</label>
                <textarea 
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-border rounded-lg outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 resize-none"
                  placeholder="e.g. Project reassignment..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowTransferForm(false)}
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
    </div>
  );
}
