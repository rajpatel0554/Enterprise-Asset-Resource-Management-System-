import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Plus, FileText, ChevronRight, UserPlus, CornerDownLeft } from 'lucide-react';

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Allocation Modal State
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [allocatedEmployee, setAllocatedEmployee] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isAdminOrManager = currentUser?.role === 'Admin' || currentUser?.role === 'AssetManager';

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Build query string
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      
      const query = params.toString() ? `?${params.toString()}` : '';

      const [assetRes, catRes, userRes] = await Promise.all([
        fetch(`http://localhost:8000/api/assets/assets/${query}`, { headers }),
        fetch(`http://localhost:8000/api/assets/categories/`, { headers }),
        isAdminOrManager ? fetch(`http://localhost:8000/api/users/`, { headers }) : Promise.resolve(null)
      ]);
      
      if (assetRes.ok) setAssets(await assetRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (userRes && userRes.ok) setUsers(await userRes.json());
    } catch (err) {
      console.error('Failed to fetch assets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, statusFilter, categoryFilter]);

  const handleOpenAllocate = (asset) => {
    setSelectedAsset(asset);
    setAllocatedEmployee('');
    setAllocationNotes('');
    setShowAllocateModal(true);
  };

  const handleAllocateAsset = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/allocations/allocations/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset: selectedAsset.id,
          employee: allocatedEmployee,
          notes: allocationNotes
        })
      });

      if (res.ok) {
        setShowAllocateModal(false);
        alert(`Successfully allocated ${selectedAsset.name}!`);
        fetchAssets();
      } else {
        const errorData = await res.json();
        // Extract any validation messages nicely without raw json formatting
        if (errorData.asset) {
          alert(errorData.asset);
        } else if (errorData.non_field_errors) {
          alert(errorData.non_field_errors[0]);
        } else {
          alert('Failed to allocate asset.');
        }
      }
    } catch (err) {
      alert('Error communicating with server.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnAsset = async (asset) => {
    if (!window.confirm(`Are you sure you want to mark ${asset.tag} (${asset.name}) as returned?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      // 1. Fetch active allocation for this asset
      const allocRes = await fetch(`http://localhost:8000/api/allocations/allocations/?asset=${asset.id}&is_active=true`, { headers });
      if (allocRes.ok) {
        const allocations = await allocRes.json();
        if (allocations.length > 0) {
          const activeAllocId = allocations[0].id;
          
          // 2. PATCH active allocation to set is_active = false
          const patchRes = await fetch(`http://localhost:8000/api/allocations/allocations/${activeAllocId}/`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: false })
          });

          if (patchRes.ok) {
            alert('Asset successfully returned and is now available.');
            fetchAssets();
            return;
          }
        }
      }
      alert('Could not find active allocation for this asset.');
    } catch (err) {
      alert('Error returning asset.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-status-success-bg text-status-success-text';
      case 'Allocated': return 'bg-status-info-bg text-status-info-text';
      case 'Maintenance': return 'bg-status-warning-bg text-status-warning-text';
      case 'Out of Service': 
      case 'Disposed': 
      case 'Lost': return 'bg-status-danger-bg text-status-danger-text';
      default: return 'bg-neutral-200 text-neutral-600';
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-neutral-text-primary">Asset Directory</h2>
          <p className="text-neutral-text-secondary text-sm mt-1">Browse, search, and manage all company assets.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg shadow-sm hover:bg-primary-700 transition-colors">
          <Plus size={18} /> Register Asset
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 shrink-0 bg-white p-4 rounded-xl border border-neutral-border shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-text-muted" />
          <input
            type="text"
            placeholder="Search by tag, name, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-border rounded-lg outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-all"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative min-w-[150px]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-sm border border-neutral-border rounded-lg appearance-none outline-none focus:border-primary-600 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-text-muted pointer-events-none" />
          </div>

          <div className="relative min-w-[150px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-sm border border-neutral-border rounded-lg appearance-none outline-none focus:border-primary-600 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Allocated">Allocated</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Out of Service">Out of Service</option>
              <option value="Disposed">Disposed</option>
              <option value="Lost">Lost</option>
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Asset Table */}
      <div className="flex-1 bg-white border border-neutral-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-neutral-surface border-b border-neutral-border sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold text-neutral-text-primary">Asset Tag</th>
                <th className="px-6 py-4 font-semibold text-neutral-text-primary">Asset Name</th>
                <th className="px-6 py-4 font-semibold text-neutral-text-primary">Category</th>
                <th className="px-6 py-4 font-semibold text-neutral-text-primary">Status</th>
                <th className="px-6 py-4 font-semibold text-neutral-text-primary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-neutral-text-secondary">
                    Loading assets...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-neutral-text-secondary">
                    <Package size={32} className="mx-auto mb-3 opacity-50" />
                    No assets match your search criteria.
                  </td>
                </tr>
              ) : (
                assets.map(asset => (
                  <tr key={asset.id} className="hover:bg-neutral-bg transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-medium text-neutral-text-primary bg-neutral-surface border border-neutral-border px-2 py-1 rounded">
                        {asset.tag}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-text-primary">{asset.name}</div>
                      {asset.description && <div className="text-xs text-neutral-text-secondary truncate max-w-[200px] mt-0.5">{asset.description}</div>}
                    </td>
                    <td className="px-6 py-4 text-neutral-text-secondary">{asset.category_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {isAdminOrManager && asset.status === 'Available' && (
                        <button 
                          onClick={() => handleOpenAllocate(asset)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors flex items-center gap-1"
                        >
                          <UserPlus size={14} /> Allocate
                        </button>
                      )}
                      {isAdminOrManager && asset.status === 'Allocated' && (
                        <button 
                          onClick={() => handleReturnAsset(asset)}
                          className="px-2.5 py-1 text-xs font-semibold text-status-danger-text bg-status-danger-bg border border-red-200 rounded hover:bg-red-100 transition-colors flex items-center gap-1"
                        >
                          <CornerDownLeft size={14} /> Return
                        </button>
                      )}
                      <button className="p-1 text-neutral-text-muted hover:text-primary-600 transition-colors rounded-lg hover:bg-primary-50 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <FileText size={16} /> <span className="text-xs font-medium">Details</span> <ChevronRight size={16}/>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Direct Allocation Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-neutral-text-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-border flex justify-between items-center">
              <h3 className="font-bold text-lg text-neutral-text-primary">Allocate Asset</h3>
              <button onClick={() => setShowAllocateModal(false)} className="text-neutral-text-muted hover:text-neutral-text-primary text-xl font-semibold">
                ×
              </button>
            </div>
            
            <form onSubmit={handleAllocateAsset} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">Asset details</label>
                <div className="font-mono text-sm text-neutral-text-primary bg-neutral-surface px-3 py-2 rounded-lg border border-neutral-border">
                  {selectedAsset?.tag} - {selectedAsset?.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">Allocate to Employee</label>
                <select 
                  required
                  value={allocatedEmployee}
                  onChange={(e) => setAllocatedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-border rounded-lg outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                >
                  <option value="" disabled>Select an employee</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">Allocation Notes</label>
                <textarea 
                  rows={3}
                  value={allocationNotes}
                  onChange={(e) => setAllocationNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-border rounded-lg outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 resize-none"
                  placeholder="Additional handoff details..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAllocateModal(false)}
                  className="flex-1 px-4 py-2 text-neutral-text-secondary font-medium hover:bg-neutral-surface rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Allocating...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
