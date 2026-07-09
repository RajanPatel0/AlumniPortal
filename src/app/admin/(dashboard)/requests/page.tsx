'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  enrollmentNo: string;
  batchYear: number;
  branch: string;
  college: string;
  course?: string | null;
  status: string;
  createdAt: string;
  campus?: { id: string; name: string } | null;
  currentRole?: string | null;
  currentCompany?: string | null;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // States for sending individual registration link
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingLink, setSendingLink] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    setSendingLink(true);
    try {
      const res = await fetch('/api/admin/registration-requests/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inviteName, email: inviteEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Invitation link sent successfully!');
        setInviteName('');
        setInviteEmail('');
      } else {
        toast.error(data.error || 'Failed to send registration link');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error sending registration link');
    } finally {
      setSendingLink(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/registration-requests');
      
      // Safety Check: Verify response type before trying to read JSON
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        const textError = await res.text();
        console.error("Server returned non-JSON/Error page:", textError);
        toast.error(`Failed to load data (${res.status}). Verify API GET route exists.`);
        setRequests([]);
        return;
      }

      const data = await res.json();
      // Handle array payload securely
      if (Array.isArray(data)) {
        setRequests(data.filter((r: RegistrationRequest) => r.status === 'PENDING'));
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      toast.error("Network error fetching registration requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    if (!requestId) return;
    setProcessingId(requestId);
    
    try {
      const payload: Record<string, unknown> = {}
      if (action === 'reject') {
        payload.rejectionReason = 'Information verification failed'
      }

      const res = await fetch(`/api/admin/registration-requests/${requestId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");

      // Handle HTML error responses natively thrown by Next.js/Turbopack
      if (!contentType || !contentType.includes("application/json")) {
        const fallbackText = await res.text();
        console.error("Expected JSON but received raw response:", fallbackText);
        toast.error(`Server routing mismatch or error (${res.status}). Action aborted.`);
        return;
      }

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || `Request ${action}ed successfully`);
        // Filter out the modified request from view immediately
        setRequests(prevRequests => prevRequests.filter(r => r.id !== requestId));
      } else {
        toast.error(data.error || `Failed to ${action} request`);
      }
    } catch (err) {
      console.error(`Error performing ${action} action:`, err);
      toast.error("Internal connection or client processing error");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg font-medium text-black animate-pulse">Loading pending registrations...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Alumni Registrations</h1>
            <p className="text-sm text-gray-500 mt-1">Review incoming joining requests for verification</p>
          </div>
          <span className="bg-blue-100 text-[#003D7A] text-xs font-bold px-3 py-1 rounded-full">
            {requests.length} Pending
          </span>
        </div>

        {/* Send Individual Registration Link Form */}
        <div className="mb-8 bg-white rounded-2xl shadow-sm border p-6 border-slate-200">
          <h2 className="text-base font-bold text-gray-950 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#003D7A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Registration Link to Individual Alumni
          </h2>
          <p className="text-xs text-gray-500 mt-1">Directly email the registration form link to alumni without database upload</p>
          
          <form onSubmit={handleSendLink} className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-[#012140]">Full Name</label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Rajan Patel"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-black placeholder-gray-400 focus:border-[#003D7A] focus:outline-none focus:ring-1 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#012140]">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="e.g. rajan@example.com"
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-black placeholder-gray-400 focus:border-[#003D7A] focus:outline-none focus:ring-1 focus:ring-blue-100"
              />
            </div>
            <button
              type="submit"
              disabled={sendingLink}
              className="w-full bg-[#003D7A] hover:bg-[#012140] text-white text-sm font-bold py-2 px-4 rounded-xl transition disabled:opacity-50 h-[38px] flex items-center justify-center cursor-pointer"
            >
              {sendingLink ? 'Sending Link...' : 'Send Link'}
            </button>
          </form>
        </div>
        
        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border">
            <p className="text-gray-500 font-medium">No pending registration requests found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-black">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-semibold text-gray-700">Name / Email</th>
                    <th className="p-4 font-semibold text-gray-700">Academic Info</th>
                    <th className="p-4 font-semibold text-gray-700">Professional Info</th>
                    <th className="p-4 font-semibold text-gray-700">Campus</th>
                    <th className="p-4 font-semibold text-gray-700">Submitted</th>
                    <th className="p-4 font-semibold text-gray-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50/70 transition">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{request.name}</div>
                        <div className="text-sm text-gray-500">{request.email}</div>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="font-medium text-gray-800">{request.branch}</div>
                        <div className="text-gray-500">Batch Year: {request.batchYear}</div>
                        {request.course && <div className="text-gray-500">{request.course}</div>}
                        <div className="text-xs text-gray-400 font-mono mt-0.5">Roll No: {request.enrollmentNo || 'N/A'}</div>
                      </td>
                      <td className="p-4 text-sm">
                        {request.currentRole || request.currentCompany ? (
                          <>
                            <div className="font-semibold text-gray-800">{request.currentRole || '—'}</div>
                            <div className="text-xs text-gray-500">{request.currentCompany || '—'}</div>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Not specified</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-700">
                        {request.campus?.name || '—'}
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          disabled={!!processingId}
                          onClick={() => handleAction(request.id, 'approve')}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
                        >
                          {processingId === request.id ? '...' : 'Approve'}
                        </button>
                        <button
                          disabled={!!processingId}
                          onClick={() => handleAction(request.id, 'reject')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}