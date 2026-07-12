import React, { useState, useEffect } from 'react';
import { Building2, Tags, Users, Plus, Edit2, ShieldAlert } from 'lucide-react';

export default function OrgSetup() {
  const [activeTab, setActiveTab] = useState('departments');
  const [data, setData] = useState({ departments: [], categories: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (currentUser?.role !== 'Admin') {
      setError('Access Denied. Only Administrators can view organization setup.');
      setLoading(false);
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [deptRes, catRes, userRes] = await Promise.all([
        fetch('http://localhost:8000/api/departments/', { headers }),
        fetch('http://localhost:8000/api/assets/categories/', { headers }),
        fetch('http://localhost:8000/api/users/', { headers })
      ]);
      
      const departments = deptRes.ok ? await deptRes.json() : [];
      const categories = catRes.ok ? await catRes.json() : [];
      const users = userRes.ok ? await userRes.json() : [];

      setData({ departments, categories, users });
    } catch (err) {
      setError('Failed to fetch data from the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`http://localhost:8000/api/users/${userId}/promote/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to update role.');
      }
    } catch (err) {
      alert('Error communicating with server.');
    }
  };

  if (loading) return <div className="text-neutral-text-secondary p-6">Loading organization data...</div>;

  if (error) return (
    <div className="flex items-center gap-3 p-6 text-status-danger-text bg-status-danger-bg rounded-lg border border-red-200">
      <ShieldAlert size={24} />
      <span className="font-semibold">{error}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-text-primary">Organization Setup</h2>
          <p className="text-neutral-text-secondary text-sm mt-1">Manage departments, asset categories, and employee roles.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-neutral-border">
        {[
          { id: 'departments', label: 'Departments', icon: Building2 },
          { id: 'categories', label: 'Asset Categories', icon: Tags },
          { id: 'users', label: 'Employee Directory', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.id 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-text-secondary hover:text-neutral-text-primary hover:border-neutral-border'}
            `}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-neutral-border rounded-xl shadow-sm overflow-hidden">
        
        {activeTab === 'departments' && (
          <div>
            <div className="p-4 border-b border-neutral-border flex justify-between items-center bg-neutral-surface">
              <h3 className="font-semibold text-neutral-text-primary">Registered Departments</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
                <Plus size={16} /> Add Department
              </button>
            </div>
            <ul className="divide-y divide-neutral-border">
              {data.departments.map(dept => (
                <li key={dept.id} className="p-4 flex justify-between items-center hover:bg-neutral-bg transition-colors">
                  <span className="font-medium text-neutral-text-primary">{dept.name}</span>
                  <button className="text-primary-600 hover:text-primary-800 p-2"><Edit2 size={16} /></button>
                </li>
              ))}
              {data.departments.length === 0 && <li className="p-6 text-center text-neutral-text-secondary">No departments found.</li>}
            </ul>
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            <div className="p-4 border-b border-neutral-border flex justify-between items-center bg-neutral-surface">
              <h3 className="font-semibold text-neutral-text-primary">Asset Categories</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
                <Plus size={16} /> Add Category
              </button>
            </div>
            <ul className="divide-y divide-neutral-border">
              {data.categories.map(cat => (
                <li key={cat.id} className="p-4 flex justify-between items-center hover:bg-neutral-bg transition-colors">
                  <div>
                    <div className="font-medium text-neutral-text-primary">{cat.name}</div>
                    <div className="text-xs text-neutral-text-secondary mt-1">{cat.description}</div>
                  </div>
                  <button className="text-primary-600 hover:text-primary-800 p-2"><Edit2 size={16} /></button>
                </li>
              ))}
              {data.categories.length === 0 && <li className="p-6 text-center text-neutral-text-secondary">No categories found.</li>}
            </ul>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-neutral-surface border-b border-neutral-border">
                <tr>
                  <th className="px-6 py-4 font-semibold text-neutral-text-primary">Employee</th>
                  <th className="px-6 py-4 font-semibold text-neutral-text-primary">Department</th>
                  <th className="px-6 py-4 font-semibold text-neutral-text-primary">Current Role</th>
                  <th className="px-6 py-4 font-semibold text-neutral-text-primary text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border">
                {data.users.map(u => (
                  <tr key={u.id} className="hover:bg-neutral-bg transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-text-primary">{u.full_name}</div>
                      <div className="text-xs text-neutral-text-secondary">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 text-neutral-text-secondary">{u.department_name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                        ${u.role === 'Admin' ? 'bg-status-danger-bg text-status-danger-text' : 
                          u.role === 'AssetManager' ? 'bg-status-warning-bg text-status-warning-text' : 
                          u.role === 'DepartmentHead' ? 'bg-primary-50 text-primary-700' : 
                          'bg-neutral-200 text-neutral-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.id !== currentUser.id && (
                        <select 
                          className="text-xs rounded border border-neutral-border bg-white px-2 py-1 outline-none focus:border-primary-600"
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="Employee">Employee</option>
                          <option value="DepartmentHead">Department Head</option>
                          <option value="AssetManager">Asset Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
