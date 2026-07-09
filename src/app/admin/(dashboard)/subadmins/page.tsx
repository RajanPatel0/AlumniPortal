'use client';

import { useEffect, useState } from 'react';
import axiosClient from '@/lib/axios-client';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

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
  createdBy: { name: string; email: string };
}

const availableModules = [
  { name: 'Dashboard', value: 'dashboard' },
  { name: 'Import Alumni', value: 'import' },
  { name: 'Alumni Management', value: 'alumni' },
  { name: 'Opportunities', value: 'jobs' },
  { name: 'Events', value: 'events' },
  { name: 'Startups', value: 'startups' },
  { name: 'Registration Requests', value: 'requests' },
];

export default function SubAdminsPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    campusId: '',
    modules: [] as string[],
    password: '',
    confirmPassword: '',
  });

  // Campus CRUD modals state
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [campusForm, setCampusForm] = useState({ name: '', code: '' });
  const [deletingCampusId, setDeletingCampusId] = useState<string | null>(null);

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

  // Campus CRUD functions
  const handleCampusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campusForm.name.trim() || !campusForm.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    try {
      if (editingCampus) {
        await axiosClient.put(`/api/admin/campuses/${editingCampus.id}`, campusForm);
        toast.success('Campus updated');
      } else {
        await axiosClient.post('/api/admin/campuses', campusForm);
        toast.success('Campus created');
      }
      await fetchCampuses();
      setShowCampusModal(false);
      setEditingCampus(null);
      setCampusForm({ name: '', code: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDeleteCampus = async (id: string) => {
    try {
      await axiosClient.delete(`/api/admin/campuses/${id}`);
      toast.success('Campus deleted');
      await fetchCampuses();
      // If the deleted campus was selected in the form, reset selection
      if (formData.campusId === id) {
        setFormData(prev => ({ ...prev, campusId: '' }));
      }
      setDeletingCampusId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Cannot delete campus with linked data');
    }
  };

  const openEditModal = (campus: Campus) => {
    setEditingCampus(campus);
    setCampusForm({ name: campus.name, code: campus.code });
    setShowCampusModal(true);
  };

  const openCreateModal = () => {
    setEditingCampus(null);
    setCampusForm({ name: '', code: '' });
    setShowCampusModal(true);
  };

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
    if (formData.modules.length === 0) {
      toast.error('Please select at least one module');
      return;
    }
    if (!formData.campusId) {
      toast.error('Please select a campus');
      return;
    }

    try {
      await axiosClient.post('/api/admin/subadmins', {
        name: formData.name,
        email: formData.email,
        campusId: formData.campusId,
        modules: formData.modules,
        password: formData.password,
      });
      toast.success('Sub-admin created successfully! Credentials sent via email.');
      setShowForm(false);
      setFormData({ name: '', email: '', campusId: '', modules: [], password: '', confirmPassword: '' });
      fetchSubAdmins();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create sub-admin');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#012140]">Sub-Admin Management</h1>
          <p className="text-gray-600 text-sm mt-1">Create and manage sub-admins with campus-specific access</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#012140] text-white rounded-lg hover:bg-[#012140]/90 transition"
        >
          + Create Sub-Admin
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Sub-Admin</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#012140]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#012140]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Assign Campus *</label>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="text-xs flex items-center gap-1 text-[#012140] hover:underline"
                >
                  <Plus size={14} /> Add Campus
                </button>
              </div>
              <select
                value={formData.campusId}
                onChange={(e) => setFormData({ ...formData, campusId: e.target.value })}
                required
                className="w-full px-3 py-2 text-[#012140] border border-gray-300 rounded-lg focus:outline-none focus:border-[#012140]"
              >
                <option value="">Select Campus</option>
                {campuses.map(campus => (
                  <option key={campus.id} value={campus.id}>{campus.name}</option>
                ))}
              </select>
              {/* List of campuses with edit/delete icons */}
              <div className="mt-2 space-y-1">
                {campuses.map(campus => (
                  <div key={campus.id} className="flex items-center justify-between text-sm text-gray-600 border-b border-gray-100 py-1">
                    <span>{campus.name} <span className="text-xs text-gray-400">({campus.code})</span></span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(campus)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCampusId(campus.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Module Access *</label>
              <div className="flex flex-wrap gap-3">
                {availableModules.map(module => (
                  <label key={module.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.modules.includes(module.value)}
                      onChange={() => handleModuleToggle(module.value)}
                      className="w-4 h-4 text-[#012140] focus:ring-[#012140]"
                    />
                    <span className="text-sm text-gray-700">{module.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#012140]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#012140]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-4 py-2 bg-[#012140] text-white rounded-lg hover:bg-[#012140]/90">
                Create Sub-Admin
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campus Create/Edit Modal */}
      {showCampusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#012140]">
                {editingCampus ? 'Edit Campus' : 'Add Campus'}
              </h2>
              <button onClick={() => setShowCampusModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCampusSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Campus Name</label>
                <input
                  type="text"
                  value={campusForm.name}
                  onChange={(e) => setCampusForm({ ...campusForm, name: e.target.value })}
                  required
                  className="w-full text-[#012140] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#012140]"
                  placeholder="e.g., Mohali Campus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Campus Code</label>
                <input
                  type="text"
                  value={campusForm.code}
                  onChange={(e) => setCampusForm({ ...campusForm, code: e.target.value })}
                  required
                  className="w-full text-[#012140] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#012140]"
                  placeholder="e.g., mohali"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-4 py-2 bg-[#012140] text-white rounded-lg hover:bg-[#012140]/90">
                  {editingCampus ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowCampusModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCampusId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-red-600 mb-2">Confirm Delete</h2>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this campus? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteCampus(deletingCampusId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeletingCampusId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Admins Table (unchanged, but now includes role column) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Campus</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Modules</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Created By</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Created At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td>
                </tr>
              ) : subAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">No staff members found</td>
                </tr>
              ) : (
                subAdmins.map(sub => (
                  <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-black">{sub.name}</td>
                    <td className="px-4 py-3 text-gray-600">{sub.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        sub.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {sub.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{sub.campus?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {sub.modules?.map((module: string) => (
                          <span key={module} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {module}
                          </span>
                        ))}
                        {(!sub.modules || sub.modules.length === 0) && '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{sub.createdBy?.name || 'System'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(sub.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}