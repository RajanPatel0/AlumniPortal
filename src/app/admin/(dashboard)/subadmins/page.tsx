'use client';

import { useEffect, useState } from 'react';
import axiosClient from '@/lib/axios-client';
import { toast } from 'react-hot-toast';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import CampusManager from './CampusManager';

interface Campus {
  id: string;
  name: string;
  code: string;
}

interface SubAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
  campus: { id: string; name: string } | null;
  modules: string[];
  createdAt: string;
  createdBy: { name: string; email: string } | null;
}

const availableModules = [
  { name: 'Dashboard', value: 'dashboard' },
  { name: 'Import Alumni', value: 'import' },
  { name: 'Alumni Management', value: 'alumni' },
  { name: 'Opportunities', value: 'jobs' },
  { name: 'Events', value: 'events' },
  { name: 'Startups', value: 'startups' },
  { name: 'Registration Requests', value: 'requests' },
  { name: 'Campus Communities', value: 'communities' },
];

export default function SubAdminsPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'subadmins' | 'campuses'>('subadmins');
  const [editingSubAdmin, setEditingSubAdmin] = useState<SubAdmin | null>(null);
  const [deletingSubAdminId, setDeletingSubAdminId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    campusId: '',
    modules: [] as string[],
    password: '',
    confirmPassword: '',
  });

  const fetchCampuses = async () => {
    try {
      const res = await axiosClient.get('/api/admin/campuses');
      setCampuses(res.data);
    } catch (err) {
      toast.error('Failed to load campuses');
    }
  };

  const fetchSubAdmins = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/admin/subadmins');
      setSubAdmins(res.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        toast.error('API endpoint not found. Please check server setup.');
      } else {
        toast.error(err.response?.data?.error || 'Failed to load sub-admins');
      }
      setSubAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampuses();
    fetchSubAdmins();
  }, []);

  const handleModuleToggle = (moduleValue: string) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.includes(moduleValue)
        ? prev.modules.filter(m => m !== moduleValue)
        : [...prev.modules, moduleValue],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!editingSubAdmin && !formData.password) {
      toast.error('Password is required');
      return;
    }
    if (formData.modules.length === 0) {
      toast.error('Please select at least one module');
      return;
    }
    if (!formData.campusId) {
      toast.error('Please select a campus');
      return;
    }

    try {
      if (editingSubAdmin) {
        await axiosClient.put(`/api/admin/subadmins/${editingSubAdmin.id}`, {
          name: formData.name,
          email: formData.email,
          campusId: formData.campusId,
          modules: formData.modules,
          ...(formData.password ? { password: formData.password } : {}),
        });
        toast.success('Sub-admin updated successfully');
      } else {
        await axiosClient.post('/api/admin/subadmins', {
          name: formData.name,
          email: formData.email,
          campusId: formData.campusId,
          modules: formData.modules,
          password: formData.password,
        });
        toast.success('Sub-admin created successfully! Credentials sent via email.');
      }
      setShowForm(false);
      setEditingSubAdmin(null);
      setFormData({ name: '', email: '', campusId: '', modules: [], password: '', confirmPassword: '' });
      fetchSubAdmins();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save sub-admin');
    }
  };

  const openEditSubAdminModal = (sub: SubAdmin) => {
    setEditingSubAdmin(sub);
    setFormData({
      name: sub.name,
      email: sub.email,
      campusId: sub.campus?.id || '',
      modules: sub.modules || [],
      password: '',
      confirmPassword: '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSubAdmin(null);
    setFormData({ name: '', email: '', campusId: '', modules: [], password: '', confirmPassword: '' });
  };

  const handleDeleteSubAdmin = async (id: string) => {
    try {
      await axiosClient.delete(`/api/admin/subadmins/${id}`);
      toast.success('Sub-admin deleted');
      setDeletingSubAdminId(null);
      fetchSubAdmins();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete sub-admin');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-[#012140] tracking-tight">Staff Management</h1>
          <p className="text-gray-500 text-sm mt-2">Manage sub-admins, coordinate campus permissions, and setup system modules.</p>
        </div>
        {activeTab === 'subadmins' && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#012140] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#012140]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#012140] transition"
          >
            <Plus size={16} /> Create Sub-Admin
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('subadmins')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === 'subadmins'
                ? 'border-[#012140] text-[#012140]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sub-Admins <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">{subAdmins.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('campuses')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === 'campuses'
                ? 'border-[#012140] text-[#012140]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Campuses <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">{campuses.length}</span>
          </button>
        </nav>
      </div>

      {/* Tab Contents */}
      {activeTab === 'campuses' ? (
        <CampusManager campuses={campuses} onChange={fetchCampuses} />
      ) : (
        <>
          {/* Sub-Admins Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Campus</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Modules</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Created By</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Created At</th>
                    <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-500">
                        <div className="flex justify-center items-center gap-2">
                          <div className="w-5 h-5 border-2 border-t-transparent border-[#012140] rounded-full animate-spin"></div>
                          <span>Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : subAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-500">No staff members found</td>
                    </tr>
                  ) : (
                    subAdmins.map(sub => (
                      <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{sub.name}</td>
                        <td className="px-6 py-4 text-gray-600">{sub.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${
                            sub.role === 'ADMIN' 
                              ? 'bg-purple-50 text-purple-700 ring-purple-600/10' 
                              : 'bg-blue-50 text-blue-700 ring-blue-700/10'
                          }`}>
                            {sub.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{sub.campus?.name || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                            {sub.modules?.map((module: string) => (
                              <span key={module} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                {availableModules.find(m => m.value === module)?.name || module}
                              </span>
                            ))}
                            {(!sub.modules || sub.modules.length === 0) && '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{sub.createdBy?.name || 'System'}</td>
                        <td className="px-6 py-4 text-gray-500">{new Date(sub.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          {sub.role === 'SUB_ADMIN' && (
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => openEditSubAdminModal(sub)}
                                className="text-blue-600 hover:text-blue-800 transition"
                                title="Edit sub-admin"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => setDeletingSubAdminId(sub.id)}
                                className="text-red-600 hover:text-red-800 transition"
                                title="Delete sub-admin"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Sub-Admin Form Overlay Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#012140]">
                {editingSubAdmin ? 'Edit Sub-Admin' : 'Create New Sub-Admin'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#012140] focus:border-[#012140] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#012140] focus:border-[#012140] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Assign Campus *</label>
                <select
                  value={formData.campusId}
                  onChange={(e) => setFormData({ ...formData, campusId: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-[#012140] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#012140] focus:border-[#012140] transition"
                >
                  <option value="">Select Campus</option>
                  {campuses.map(campus => (
                    <option key={campus.id} value={campus.id}>{campus.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Manage campuses in the Campus Management tab.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Module Access *</label>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  {availableModules.map(module => (
                    <label key={module.value} className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.modules.includes(module.value)}
                        onChange={() => handleModuleToggle(module.value)}
                        className="w-4.5 h-4.5 rounded text-[#012140] border-gray-300 focus:ring-[#012140]"
                      />
                      <span className="text-sm text-gray-700 font-medium">{module.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {editingSubAdmin ? 'New Password (leave blank to keep current)' : 'Temporary Password *'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingSubAdmin}
                    minLength={6}
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#012140] focus:border-[#012140] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {editingSubAdmin ? 'Confirm New Password' : 'Confirm Password *'}
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required={!editingSubAdmin || !!formData.password}
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#012140] focus:border-[#012140] transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#012140] text-white font-semibold rounded-lg hover:bg-[#012140]/90 shadow-sm transition">
                  {editingSubAdmin ? 'Update Sub-Admin' : 'Create Sub-Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Admin Delete Confirmation Modal */}
      {deletingSubAdminId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-red-600 mb-2">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this sub-admin? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingSubAdminId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSubAdmin(deletingSubAdminId)}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
