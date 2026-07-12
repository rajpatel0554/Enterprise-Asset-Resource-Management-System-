import React, { useState, useEffect } from 'react';
import { ClipboardList, Play, CheckCircle, XCircle, Search, FileText, ArrowLeft } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationModal from '../Shared/ConfirmationModal';

export default function Audits() {
  const [cycles, setCycles] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState(null);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [cycleName, setCycleName] = useState('');

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isAdminOrManager = currentUser?.role === 'Admin' || currentUser?.role === 'AssetManager';
  const { showToast } = useToast();

  const [confirmComplete, setConfirmComplete] = useState(false); // for complete audit modal

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`http://localhost:8000/api/audits/cycles/`, { headers });
      if (res.ok) setCycles(await res.json());
    } catch (err) {
      console.error('Failed to fetch cycles', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async (cycleId) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`http://localhost:8000/api/audits/entries/?audit_cycle=${cycleId}`, { headers });
      if (res.ok) {
        setEntries(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch entries', err);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const createCycle = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8000/api/audits/cycles/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cycleName })
      });
      if (res.ok) {
        setShowCreateForm(false);
        setCycleName('');
        fetchCycles();
      } else {
        showToast('Failed to create audit cycle.', 'error');
      }
    } catch (err) {
      showToast('Error communicating with server.', 'error');
    }
  };

  const handleAction = async (url, successMsg) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(successMsg, 'success');
        fetchCycles();
        if (selectedCycle) fetchEntries(selectedCycle.id);
      } else {
        const errorData = await res.json();
        showToast(errorData.detail || 'Action failed.', 'error');
      }
    } catch (err) {
      showToast('Error communicating with server.', 'error');
    }
  };

  const updateEntryStatus = async (entryId, status) => {
    try {
      const res = await fetch(`http://localhost:8000/api/audits/entries/${entryId}/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchEntries(selectedCycle.id);
        fetchCycles();
      }
    } catch (err) {
      showToast('Error communicating with server.', 'error');
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-neutral-text-primary">Asset Audits</h2>
          <p className="text-neutral-text-secondary text-sm mt-1">Manage physical verification and inventory cycles.</p>
        </div>
        {isAdminOrManager && (
          <button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg shadow-sm hover:bg-primary-700 transition-colors"
          >
            <ClipboardList size={18} /> New Audit Cycle
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Col: Cycles List */}
        <div className={`lg:col-span-1 bg-white border border-neutral-border rounded-xl shadow-sm flex flex-col overflow-hidden ${selectedCycle ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-neutral-border bg-neutral-surface">
            <h3 className="font-semibold text-neutral-text-primary">Audit Cycles</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-neutral-text-secondary text-sm">Loading cycles...</div>
            ) : cycles.length === 0 ? (
              <div className="text-center py-8 px-4">
                <ClipboardList size={36} className="mx-auto mb-2 text-neutral-text-muted opacity-30" />
                <p className="text-sm font-semibold text-neutral-text-primary">No audit cycles yet</p>
                <p className="text-xs text-neutral-text-muted mt-1">Create your first audit cycle using the '+ New Cycle' button above.</p>
              </div>
            ) : (
              cycles.map(cycle => (
                <div 
                  key={cycle.id}
                  onClick={() => {
                    setSelectedCycle(cycle);
                    fetchEntries(cycle.id);
                  }}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedCycle?.id === cycle.id ? 'border-primary-500 bg-primary-50/50' : 'border-neutral-border hover:bg-neutral-bg'}`}
                >
                  <div className="font-semibold text-neutral-text-primary">{cycle.name}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      cycle.status === 'Completed' ? 'bg-status-success-bg text-status-success-text' :
                      cycle.status === 'Draft' ? 'bg-neutral-200 text-neutral-600' : 'bg-status-info-bg text-status-info-text'
                    }`}>
                      {cycle.status}
                    </span>
                    <span className="text-xs text-neutral-text-secondary">{cycle.verified_count}/{cycle.entries_count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Audit Entries / Details */}
        <div className={`lg:col-span-2 bg-white border border-neutral-border rounded-xl shadow-sm flex flex-col overflow-hidden ${!selectedCycle ? 'hidden lg:flex' : 'flex'}`}>
          {selectedCycle ? (
            <>
              <div className="p-4 border-b border-neutral-border bg-neutral-surface flex justify-between items-center flex-wrap gap-2">
                <div>
                  <button 
                    onClick={() => setSelectedCycle(null)}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 mb-1.5"
                  >
                    <ArrowLeft size={12} /> Back to Cycles List
                  </button>
                  <h3 className="font-semibold text-neutral-text-primary">{selectedCycle.name}</h3>
                  <p className="text-xs text-neutral-text-secondary mt-0.5">Status: {selectedCycle.status}</p>
                </div>
                {isAdminOrManager && selectedCycle.status === 'Draft' && (
                  <button 
                    onClick={() => handleAction(`http://localhost:8000/api/audits/cycles/${selectedCycle.id}/populate/`, 'Successfully populated assets.')}
                    className="flex items-center gap-1 text-sm bg-primary-100 text-primary-700 px-3 py-1.5 rounded hover:bg-primary-200 transition-colors"
                  >
                    <Play size={14} /> Populate Assets
                  </button>
                )}
                {isAdminOrManager && selectedCycle.status === 'In Progress' && (
                  <button 
                    onClick={() => setConfirmComplete(true)}
                    className="flex items-center gap-1 text-sm bg-status-success-bg text-status-success-text border border-green-200 px-3 py-1.5 rounded hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle size={14} /> Complete Audit
                  </button>
                )}
                {isAdminOrManager && selectedCycle.status === 'Draft' && entries.length > 0 && (
                   <button 
                    onClick={async () => {
                       await fetch(`http://localhost:8000/api/audits/cycles/${selectedCycle.id}/`, {
                         method: 'PATCH',
                         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                         body: JSON.stringify({ status: 'In Progress' })
                       });
                       fetchCycles();
                       setSelectedCycle({...selectedCycle, status: 'In Progress'});
                    }}
                   className="flex items-center gap-1 text-sm bg-status-info-bg text-status-info-text border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors"
                 >
                   <Play size={14} /> Start Audit
                 </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-0">
                {entries.length === 0 ? (
                  <div className="text-center text-neutral-text-secondary py-12">
                    <FileText size={32} className="mx-auto mb-3 opacity-50" />
                    <p>No assets populated for this cycle.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-neutral-surface border-b border-neutral-border sticky top-0">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-neutral-text-primary">Asset Tag</th>
                        <th className="px-4 py-3 font-semibold text-neutral-text-primary">Name</th>
                        <th className="px-4 py-3 font-semibold text-neutral-text-primary">Status</th>
                        <th className="px-4 py-3 font-semibold text-neutral-text-primary text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-border">
                      {entries.map(entry => (
                        <tr key={entry.id} className="hover:bg-neutral-bg transition-colors">
                          <td className="px-4 py-3 font-mono font-medium text-xs text-neutral-600">{entry.asset_details.tag}</td>
                          <td className="px-4 py-3 font-medium text-neutral-text-primary">{entry.asset_details.name}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              entry.status === 'Verified' ? 'bg-status-success-bg text-status-success-text' :
                              entry.status === 'Missing' || entry.status === 'Damaged' ? 'bg-status-danger-bg text-status-danger-text' : 'bg-neutral-200 text-neutral-600'
                            }`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {selectedCycle.status === 'In Progress' && (
                              <div className="flex justify-end gap-2">
                                <button onClick={() => updateEntryStatus(entry.id, 'Verified')} className="text-status-success-text hover:bg-status-success-bg p-1 rounded" title="Mark Verified"><CheckCircle size={16} /></button>
                                <button onClick={() => updateEntryStatus(entry.id, 'Damaged')} className="text-status-warning-text hover:bg-status-warning-bg p-1 rounded" title="Mark Damaged"><XCircle size={16} /></button>
                                <button onClick={() => updateEntryStatus(entry.id, 'Missing')} className="text-status-danger-text hover:bg-status-danger-bg p-1 rounded" title="Mark Missing"><XCircle size={16} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-text-secondary p-6">
              <ClipboardList size={48} className="mb-4 opacity-20" />
              <p>Select an audit cycle from the left to view details.</p>
            </div>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-neutral-text-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-border flex justify-between items-center">
              <h3 className="font-bold text-lg text-neutral-text-primary">New Audit Cycle</h3>
              <button onClick={() => setShowCreateForm(false)} className="text-neutral-text-muted hover:text-neutral-text-primary">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={createCycle} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">Cycle Name</label>
                <input 
                  type="text"
                  required
                  value={cycleName}
                  onChange={(e) => setCycleName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-border rounded-lg outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                  placeholder="e.g. Q3 2026 IT Asset Audit"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 text-neutral-text-secondary font-medium hover:bg-neutral-surface rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                  Create Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmComplete}
        title="Complete Audit Cycle"
        message={`Are you sure you want to mark "${selectedCycle?.name}" as Complete? This will close the audit cycle and cannot be reversed.`}
        confirmLabel="Yes, Complete"
        onCancel={() => setConfirmComplete(false)}
        onConfirm={() => {
          handleAction(`http://localhost:8000/api/audits/cycles/${selectedCycle?.id}/complete/`, 'Audit Cycle Completed.');
          setConfirmComplete(false);
        }}
      />
    </div>
  );
}

