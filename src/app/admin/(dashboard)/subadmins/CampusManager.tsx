'use client';

import { useState } from 'react';
import axiosClient from '@/lib/axios-client';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface Campus {
  id: string;
  name: string;
  code: string;
}

export default function CampusManager({
  campuses,
  onChange,
}: {
  campuses: Campus[];
  onChange: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [campusForm, setCampusForm] = useState({ name: '', code: '' });
  const [deletingCampusId, setDeletingCampusId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingCampus(null);
    setCampusForm({ name: '', code: '' });
    setShowModal(true);
  };

  const openEditModal = (campus: Campus) => {
    setEditingCampus(campus);
    setCampusForm({ name: campus.name, code: campus.code });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      onChange();
      setShowModal(false);
      setEditingCampus(null);
      setCampusForm({ name: '', code: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosClient.delete(`/api/admin/campuses/${id}`);
      toast.success('Campus deleted');
      onChange();
      setDeletingCampusId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Cannot delete campus with linked data');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar inside Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#012140]">Campuses</h2>
          <p className="text-gray-500 text-sm">Add or edit university campuses which are assigned to sub-admins.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#012140] text-white text-sm font-semibold rounded-lg hover:bg-[#012140]/90 shadow-sm transition"
        >
          <Plus size={16} /> Add Campus
        </button>
      </div>

      {/* Campuses Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">Campus Name</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Campus Code</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campuses.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-500">No campuses found</td>
                </tr>
              ) : (
                campuses.map(campus => (
                  <tr key={campus.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{campus.name}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{campus.code}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => openEditModal(campus)}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="Edit campus"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCampusId(campus.id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Delete campus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campus Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#012140]">
                {editingCampus ? 'Edit Campus' : 'Add Campus'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Campus Name *</label>
                <input
                  type="text"
                  value={campusForm.name}
                  onChange={(e) => setCampusForm({ ...campusForm, name: e.target.value })}
                  required
                  className="w-full text-[#012140] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#012140] focus:border-[#012140] transition"
                  placeholder="e.g., Mohali Campus"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Campus Code *</label>
                <input
                  type="text"
                  value={campusForm.code}
                  onChange={(e) => setCampusForm({ ...campusForm, code: e.target.value })}
                  required
                  className="w-full text-[#012140] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#012140] focus:border-[#012140] transition"
                  placeholder="e.g., mohali"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#012140] text-white font-semibold rounded-lg hover:bg-[#012140]/90 shadow-sm transition">
                  {editingCampus ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCampusId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-red-600 mb-2">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this campus? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingCampusId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingCampusId)}
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

