'use client';

import React, { useState } from 'react';
import { toggleFollowAlumni } from '@/actions/alumni-follow';
import { apiFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import { Users, X, UserMinus, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface ProfileFollowSectionProps {
  profileId: string;
  currentUserId: string | null;
  initialIsFollowing: boolean;
  initialFollowersCount: number;
  initialFollowingCount: number;
}

export default function ProfileFollowSection({
  profileId,
  currentUserId,
  initialIsFollowing,
  initialFollowersCount,
  initialFollowingCount,
}: ProfileFollowSectionProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [followingCount, setFollowingCount] = useState(initialFollowingCount);
  const [isToggling, setIsToggling] = useState(false);

  // Modal State
  const [activeModal, setActiveModal] = useState<'followers' | 'following' | null>(null);
  const [modalUsers, setModalUsers] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchModalUsers = async (type: 'followers' | 'following', resetPage = false) => {
    setModalLoading(true);
    try {
      const nextPage = resetPage ? 1 : page + 1;
      const res = await apiFetch(`/alumni/${profileId}/${type}?page=${nextPage}&limit=15`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setModalUsers((prev) => (resetPage ? json.data : [...prev, ...json.data]));
          setPage(nextPage);
          setHasMore(nextPage < json.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load list');
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenModal = (type: 'followers' | 'following') => {
    setActiveModal(type);
    setModalUsers([]);
    setPage(0);
    setHasMore(false);
    fetchModalUsers(type, true);
  };

  const handleFollowToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);

    // Optimistic Update
    const nextFollowingState = !isFollowing;
    setIsFollowing(nextFollowingState);
    setFollowersCount((prev) => prev + (nextFollowingState ? 1 : -1));

    try {
      const res = await toggleFollowAlumni(profileId);
      if (res.success) {
        toast.success(res.isFollowing ? 'Following user!' : 'Unfollowed user');
        setIsFollowing(!!res.isFollowing);
      } else {
        // Rollback
        setIsFollowing(!nextFollowingState);
        setFollowersCount((prev) => prev + (nextFollowingState ? -1 : 1));
        toast.error(res.error || 'Failed to update follow status');
      }
    } catch {
      // Rollback
      setIsFollowing(!nextFollowingState);
      setFollowersCount((prev) => prev + (nextFollowingState ? -1 : 1));
      toast.error('Failed to update follow status');
    } finally {
      setIsToggling(false);
    }
  };

  const handleModalFollowToggle = async (targetId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const targetUser = modalUsers.find((u) => u.id === targetId);
    if (!targetUser) return;

    const previousIsFollowing = !!targetUser.isFollowing;
    const nextFollowingState = !previousIsFollowing;

    // Optimistic Update
    setModalUsers((prev) =>
      prev.map((user) =>
        user.id === targetId ? { ...user, isFollowing: nextFollowingState } : user
      )
    );

    const isOwn = currentUserId === profileId;
    if (isOwn && activeModal === 'following') {
      setFollowingCount((prev) => prev + (nextFollowingState ? 1 : -1));
    }

    try {
      const res = await toggleFollowAlumni(targetId);
      if (res.success) {
        toast.success(res.isFollowing ? 'Following user!' : 'Unfollowed user');
        setModalUsers((prev) =>
          prev.map((user) =>
            user.id === targetId ? { ...user, isFollowing: !!res.isFollowing } : user
          )
        );
      } else {
        // Rollback
        setModalUsers((prev) =>
          prev.map((user) =>
            user.id === targetId ? { ...user, isFollowing: previousIsFollowing } : user
          )
        );
        if (isOwn && activeModal === 'following') {
          setFollowingCount((prev) => prev + (previousIsFollowing ? 1 : -1));
        }
        toast.error(res.error || 'Failed to update follow status');
      }
    } catch {
      // Rollback
      setModalUsers((prev) =>
        prev.map((user) =>
          user.id === targetId ? { ...user, isFollowing: previousIsFollowing } : user
        )
      );
      if (isOwn && activeModal === 'following') {
        setFollowingCount((prev) => prev + (previousIsFollowing ? 1 : -1));
      }
      toast.error('Failed to update follow status');
    }
  };

  const isOwnProfile = currentUserId === profileId;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Follow stats row */}
      <div className="flex items-center gap-4 text-sm font-semibold text-slate-600 mt-1">
        <button
          onClick={() => handleOpenModal('followers')}
          className="hover:text-[#003D7A] transition-colors flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full border-none"
        >
          <span className="text-slate-900 font-extrabold">{followersCount}</span> Followers
        </button>
        <button
          onClick={() => handleOpenModal('following')}
          className="hover:text-[#003D7A] transition-colors flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full border-none"
        >
          <span className="text-slate-900 font-extrabold">{followingCount}</span> Following
        </button>
      </div>

      {/* Follow Button (only for other users) */}
      {!isOwnProfile && currentUserId && (
        <div className="w-full sm:w-auto">
          <button
            onClick={handleFollowToggle}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer ${
              isFollowing
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                : 'bg-[#003D7A] hover:bg-[#002654] text-white border-none'
            }`}
          >
            {isFollowing ? (
              <>
                <UserMinus className="w-4 h-4 text-emerald-600" /> Following
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Follow
              </>
            )}
          </button>
        </div>
      )}

      {/* Followers/Following Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-[150] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50 rounded-t-3xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#003D7A]" />
                {activeModal === 'followers' ? 'Followers' : 'Following'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-full transition border-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {modalUsers.length === 0 && !modalLoading && (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No users found
                </div>
              )}
              {modalUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-slate-50 transition"
                >
                  <Link
                    href={`/alumni/profile/${user.id}`}
                    onClick={() => setActiveModal(null)}
                    className="flex items-center gap-3 min-w-0 flex-1 group no-underline"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-600 font-bold shrink-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-[#003D7A] transition truncate m-0">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate m-0 mt-0.5">
                        {user.currentRole || 'Alumni'}
                        {user.currentCompany ? ` at ${user.currentCompany}` : ''}
                      </p>
                    </div>
                  </Link>

                  {/* Follow Button for user inside modal */}
                  {currentUserId && currentUserId !== user.id && (
                    <button
                      onClick={(e) => handleModalFollowToggle(user.id, e)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition shadow-sm border-none cursor-pointer shrink-0 ${
                        user.isFollowing
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                          : 'bg-[#003D7A] hover:bg-[#002654] text-white'
                      }`}
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}

              {modalLoading && (
                <div className="text-center py-4 text-xs text-slate-500">
                  Loading users...
                </div>
              )}

              {hasMore && !modalLoading && (
                <button
                  onClick={() => fetchModalUsers(activeModal)}
                  className="w-full py-2.5 text-xs font-bold text-[#003D7A] hover:bg-blue-50 rounded-xl transition border-none cursor-pointer"
                >
                  Load More
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
