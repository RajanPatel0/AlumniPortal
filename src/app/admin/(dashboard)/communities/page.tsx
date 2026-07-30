"use client";

import React, { useState, useEffect } from "react";
import { MarkdownEditor } from "@/components/community/MarkdownEditor";
import { ImageUploader } from "@/components/ImageUploader";
import { MemberBadgeTag, CommunityRoleTagType } from "@/components/community/MemberBadgeTag";
import { Plus, Search, Edit2, Trash2, Building2, Users, ExternalLink, X, Check, UserPlus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getAdminCommunitiesAction,
  createAdminCommunityAction,
  updateAdminCommunityAction,
  deleteAdminCommunityAction,
  getAdminCommunityMembersAction,
  updateAdminMemberRoleAction,
  removeAdminMemberAction,
  searchCandidateUsersAction,
} from "@/actions/communities";
import { communitySchema, memberRoleUpdateSchema } from "@/schemas/community";
import { useDebounce } from "@/lib/useDebounce";
import { COMMUNITY_CATEGORIES } from "@/lib/community-permissions";

interface Campus {
  id: string;
  name: string;
  code: string;
}

interface CommunityMember {
  id: string;
  roleTag: CommunityRoleTagType;
  customTitle?: string | null;
  joinedAt: string;
  alumni?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    email: string;
    branch: string;
    batchYear: number;
  } | null;
  staff?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface Community {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  category: string;
  campusId?: string | null;
  campus?: Campus | null;
  externalLinks?: Record<string, string> | null;
  isActive: boolean;
  _count: {
    members: number;
    updates: number;
    blogs: number;
  };
}

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Edit / Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);

  // Members Management Modal State
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedCommunityForMembers, setSelectedCommunityForMembers] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingRoleTag, setEditingRoleTag] = useState<CommunityRoleTagType>("MEMBER");
  const [editingCustomTitle, setEditingCustomTitle] = useState("");
  const [savingMember, setSavingMember] = useState(false);

  // Add New Member Search State
  const [showAddMember, setShowAddMember] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const debouncedUserSearchQuery = useDebounce(userSearchQuery, 300);
  const [searchResults, setSearchResults] = useState<{ alumni: any[]; staff: any[] }>({ alumni: [], staff: [] });
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [newMemberRoleTag, setNewMemberRoleTag] = useState<CommunityRoleTagType>("MEMBER");
  const [newMemberCustomTitle, setNewMemberCustomTitle] = useState("");

  useEffect(() => {
    if (!debouncedUserSearchQuery.trim()) {
      setSearchResults({ alumni: [], staff: [] });
      return;
    }
    let isCancelled = false;
    setSearchingUsers(true);
    searchCandidateUsersAction(debouncedUserSearchQuery).then((res) => {
      if (!isCancelled) {
        if (res.success) {
          setSearchResults({ alumni: res.alumni, staff: res.staff });
        }
        setSearchingUsers(false);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [debouncedUserSearchQuery]);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [category, setCategory] = useState("General");
  const [campusId, setCampusId] = useState("");
  const [website, setWebsite] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [discord, setDiscord] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // User Role Scoping State
  const [currentUserRole, setCurrentUserRole] = useState<string>("STAFF");
  const [userCampusId, setUserCampusId] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const res = await getAdminCommunitiesAction();
      if (res.success) {
        setCommunities(res.communities as Community[]);
        setCampuses(res.campuses);
        setCurrentUserRole(res.userRole);
        setUserCampusId(res.userCampusId);
      }
    } catch (e) {
      console.error("Error loading initial communities data:", e);
    } finally {
      setLoading(false);
    }
  };

  const openMembersModal = async (comm: Community) => {
    setSelectedCommunityForMembers(comm);
    setMemberSearch("");
    setShowAddMember(false);
    setUserSearchQuery("");
    setSearchResults({ alumni: [], staff: [] });
    setIsMembersModalOpen(true);
    setLoadingMembers(true);
    try {
      const res = await getAdminCommunityMembersAction(comm.id);
      if (res.success) {
        setMembers(res.data as CommunityMember[]);
      } else {
        toast.error(res.error || "Failed to load community members");
      }
    } catch (e: any) {
      toast.error("Failed to load community members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSearchCandidateUsers = async (q: string) => {
    setUserSearchQuery(q);
    if (!q.trim()) {
      setSearchResults({ alumni: [], staff: [] });
      return;
    }
    setSearchingUsers(true);
    try {
      const res = await searchCandidateUsersAction(q);
      if (res.success) {
        setSearchResults({ alumni: res.alumni, staff: res.staff });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleAddUserToCommunity = async (user: { alumniId?: string; staffId?: string }) => {
    if (!selectedCommunityForMembers) return;
    const payload = {
      alumniId: user.alumniId,
      staffId: user.staffId,
      roleTag: newMemberRoleTag,
      customTitle: newMemberCustomTitle,
    };

    const validated = memberRoleUpdateSchema.safeParse(payload);
    if (!validated.success) {
      toast.error(validated.error.issues[0]?.message || "Invalid payload");
      return;
    }

    setSavingMember(true);
    try {
      const res = await updateAdminMemberRoleAction(selectedCommunityForMembers.id, validated.data);
      if (res.success) {
        toast.success("User added to community!");
        setUserSearchQuery("");
        setSearchResults({ alumni: [], staff: [] });
        openMembersModal(selectedCommunityForMembers);
        loadInitialData();
      } else {
        toast.error(res.error || "Failed to add user");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingMember(false);
    }
  };

  const handleUpdateMemberRole = async (member: CommunityMember) => {
    if (!selectedCommunityForMembers) return;

    const payload = {
      alumniId: member.alumni?.id,
      staffId: member.staff?.id,
      roleTag: editingRoleTag,
      customTitle: editingCustomTitle,
    };

    const validated = memberRoleUpdateSchema.safeParse(payload);
    if (!validated.success) {
      toast.error(validated.error.issues[0]?.message || "Invalid member role data");
      return;
    }

    setSavingMember(true);
    try {
      const res = await updateAdminMemberRoleAction(selectedCommunityForMembers.id, validated.data);

      if (res.success) {
        toast.success("Member role updated!");
        setEditingMemberId(null);
        openMembersModal(selectedCommunityForMembers);
      } else {
        toast.error(res.error || "Failed to update member");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setSavingMember(false);
    }
  };

  const handleRemoveMember = async (member: CommunityMember) => {
    if (!selectedCommunityForMembers || !confirm("Remove this member from the community?")) return;
    try {
      const res = await removeAdminMemberAction(selectedCommunityForMembers.id, {
        alumniId: member.alumni?.id,
        staffId: member.staff?.id,
      });

      if (res.success) {
        toast.success("Member removed");
        openMembersModal(selectedCommunityForMembers);
        loadInitialData();
      } else {
        toast.error(res.error || "Failed to remove member");
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openCreateModal = () => {
    setEditingCommunity(null);
    setName("");
    setSlug("");
    setDescription("");
    setLogoUrl("");
    setBannerUrl("");
    setCategory("General");
    setCampusId("");
    setWebsite("");
    setWhatsapp("");
    setTelegram("");
    setLinkedin("");
    setGithub("");
    setDiscord("");
    setIsModalOpen(true);
  };

  const openEditModal = (comm: Community) => {
    setEditingCommunity(comm);
    setName(comm.name);
    setSlug(comm.slug);
    setDescription(comm.description);
    setLogoUrl(comm.logoUrl || "");
    setBannerUrl(comm.bannerUrl || "");
    setCategory(comm.category || "General");
    setCampusId(comm.campusId || "");
    setWebsite(comm.externalLinks?.website || "");
    setWhatsapp(comm.externalLinks?.whatsapp || "");
    setTelegram(comm.externalLinks?.telegram || "");
    setLinkedin(comm.externalLinks?.linkedin || "");
    setGithub(comm.externalLinks?.github || "");
    setDiscord(comm.externalLinks?.discord || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const externalLinks: Record<string, string> = {};
    if (website.trim()) externalLinks.website = website;
    if (whatsapp.trim()) externalLinks.whatsapp = whatsapp;
    if (telegram.trim()) externalLinks.telegram = telegram;
    if (linkedin.trim()) externalLinks.linkedin = linkedin;
    if (github.trim()) externalLinks.github = github;
    if (discord.trim()) externalLinks.discord = discord;

    const payload = {
      name,
      slug: slug.trim() || undefined,
      description,
      logoUrl: logoUrl || null,
      bannerUrl: bannerUrl || null,
      category,
      campusId: campusId || null,
      externalLinks,
    };

    const validated = communitySchema.safeParse(payload);
    if (!validated.success) {
      toast.error(validated.error.issues[0]?.message || "Validation failed");
      return;
    }

    setSubmitting(true);
    try {
      const res = editingCommunity
        ? await updateAdminCommunityAction(editingCommunity.id, validated.data)
        : await createAdminCommunityAction(validated.data);

      if (res.success) {
        toast.success(editingCommunity ? "Community updated" : "Community created");
        setIsModalOpen(false);
        loadInitialData();
      } else {
        toast.error(res.error || "Failed to save community");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this community?")) return;
    try {
      const res = await deleteAdminCommunityAction(id);
      if (res.success) {
        toast.success("Community deleted");
        loadInitialData();
      } else {
        toast.error(res.error || "Failed to delete community");
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filteredCommunities = communities.filter((c) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = c.name.toLowerCase().includes(query);
    const slugMatch = c.slug.toLowerCase().includes(query);
    const catMatch = c.category.toLowerCase().includes(query);
    const campusMatch = c.campus?.name.toLowerCase().includes(query) || false;
    return nameMatch || slugMatch || catMatch || campusMatch;
  });

  const filteredMembers = members.filter((m) => {
    const query = memberSearch.toLowerCase().trim();
    if (!query) return true;
    const name = m.alumni?.name || m.staff?.name || "";
    const email = m.alumni?.email || m.staff?.email || "";
    const customTitle = m.customTitle || "";
    const roleTag = m.roleTag || "";
    const branch = m.alumni?.branch || "";
    const batchYear = m.alumni?.batchYear ? String(m.alumni.batchYear) : "";

    return (
      name.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      customTitle.toLowerCase().includes(query) ||
      roleTag.toLowerCase().includes(query) ||
      branch.toLowerCase().includes(query) ||
      batchYear.includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Campus Communities Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? "..." : `${filteredCommunities.length} communities`}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#003D7A] hover:bg-[#002b56] text-white text-sm font-bold rounded-xl transition shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          <span>Create Community</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search communities by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-[#012140] pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-sm"
          />
        </div>
      </div>

      {/* Communities Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading communities...</div>
        ) : filteredCommunities.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-semibold">No communities found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Community</th>
                  <th className="p-4">Campus</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Members</th>
                  <th className="p-4">Updates</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCommunities.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt={c.name} className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-[#003D7A] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                        <p className="text-[11px] text-slate-400">/{c.slug}</p>
                      </div>
                    </td>

                    <td className="p-4">
                      {c.campus ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#003D7A] font-semibold text-[11px] border border-blue-100">
                          <Building2 className="w-3 h-3 text-[#003D7A]" /> {c.campus.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Global (All Campuses)</span>
                      )}
                    </td>

                    <td className="p-4 font-semibold text-slate-700">{c.category}</td>

                    <td className="p-4 font-bold text-slate-900">{c._count.members}</td>
                    <td className="p-4 font-bold text-slate-900">{c._count.updates}</td>

                    <td className="p-4 text-right space-x-1">
                      <button
                        onClick={() => openMembersModal(c)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#003D7A] hover:bg-slate-100 transition cursor-pointer"
                        title="Manage Members & Role Tags"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#003D7A] hover:bg-slate-100 transition cursor-pointer"
                        title="Edit Community"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Community"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Management Modal */}
      {isMembersModalOpen && selectedCommunityForMembers && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50 rounded-t-2xl shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Community Members & Role Tags
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedCommunityForMembers.name} · {members.length} members connected
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="px-3 py-1.5 bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{showAddMember ? "Close Add Panel" : "Add Member"}</span>
                </button>
                <button onClick={() => setIsMembersModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-full transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Add Member Panel */}
            {showAddMember && (
              <div className="p-4 bg-blue-50/70 border-b border-blue-100 space-y-3 shrink-0">
                <p className="text-xs font-bold text-[#003D7A] flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" /> Search & Add New User to Community
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                    <input
                      type="text"
                      placeholder="Search registered alumni or staff by name or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full bg-white text-slate-900 pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={newMemberRoleTag}
                      onChange={(e) => setNewMemberRoleTag(e.target.value as CommunityRoleTagType)}
                      className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 w-full"
                    >
                      <option value="LEADER">Leader</option>
                      <option value="COORDINATOR">Coordinator</option>
                      <option value="CORE_MEMBER">Core Member</option>
                      <option value="ADVISOR">Advisor</option>
                      <option value="MEMBER">Member</option>
                    </select>
                  </div>
                </div>

                {userSearchQuery.trim().length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm scrollbar-thin">
                    {searchingUsers ? (
                      <div className="p-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#003D7A]" /> Searching users...
                      </div>
                    ) : searchResults.alumni.length === 0 && searchResults.staff.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500 font-medium">No matching user found.</div>
                    ) : (
                      <>
                        {searchResults.alumni.map((u) => {
                          const isAlreadyMember = members.some((m) => m.alumni?.id === u.id);
                          return (
                            <div key={u.id} className="p-2 flex items-center justify-between hover:bg-slate-50 text-xs">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-900">{u.name}</p>
                                  <span className="text-[10px] text-blue-600 font-semibold">(Alumni)</span>
                                  {u.campus?.code && (
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-slate-100 text-[#003D7A] font-bold text-[10px] border border-slate-200">
                                      {u.campus.code}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400">{u.email} · Batch {u.batchYear} ({u.branch})</p>
                              </div>
                              {isAlreadyMember ? (
                                <span className="text-[11px] text-slate-400 font-medium italic">Connected</span>
                              ) : (
                                <button
                                  onClick={() => handleAddUserToCommunity({ alumniId: u.id })}
                                  disabled={savingMember}
                                  className="px-2.5 py-1 bg-[#003D7A] hover:bg-[#002b56] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  Add User
                                </button>
                              )}
                            </div>
                          );
                        })}
                        {searchResults.staff.map((s) => {
                          const isAlreadyMember = members.some((m) => m.staff?.id === s.id);
                          return (
                            <div key={s.id} className="p-2 flex items-center justify-between hover:bg-slate-50 text-xs">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-900">{s.name}</p>
                                  <span className="text-[10px] text-purple-600 font-semibold">(Staff)</span>
                                  {s.campus?.code && (
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-slate-100 text-[#003D7A] font-bold text-[10px] border border-slate-200">
                                      {s.campus.code}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400">{s.email} · {s.role}</p>
                              </div>
                              {isAlreadyMember ? (
                                <span className="text-[11px] text-slate-400 font-medium italic">Connected</span>
                              ) : (
                                <button
                                  onClick={() => handleAddUserToCommunity({ staffId: s.id })}
                                  disabled={savingMember}
                                  className="px-2.5 py-1 bg-[#003D7A] hover:bg-[#002b56] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  Add User
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Filter connected community members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full text-slate-900 pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-4 space-y-3">
              {loadingMembers ? (
                <div className="p-8 text-center text-slate-500">Loading members...</div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-semibold">No members found in this community.</div>
              ) : (
                filteredMembers.map((m) => {
                  const isEditing = editingMemberId === m.id;
                  const name = m.alumni?.name || m.staff?.name || "Member";

                  return (
                    <div key={m.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-[#003D7A] shrink-0">
                          {m.alumni?.avatarUrl ? (
                            <img src={m.alumni.avatarUrl} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            name.slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 text-sm">{name}</p>
                            <MemberBadgeTag roleTag={m.roleTag} customTitle={m.customTitle} size="sm" />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {m.alumni ? `${m.alumni.email} · Batch ${m.alumni.batchYear} (${m.alumni.branch})` : m.staff?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                        {isEditing ? (
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 flex-wrap">
                            <select
                              value={editingRoleTag}
                              onChange={(e) => setEditingRoleTag(e.target.value as CommunityRoleTagType)}
                              className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800"
                            >
                              <option value="LEADER">Leader</option>
                              <option value="COORDINATOR">Coordinator</option>
                              <option value="CORE_MEMBER">Core Member</option>
                              <option value="ADVISOR">Advisor</option>
                              <option value="MEMBER">Member</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Custom title (e.g. President)"
                              value={editingCustomTitle}
                              onChange={(e) => setEditingCustomTitle(e.target.value)}
                              className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 w-36"
                            />
                            <button
                              onClick={() => handleUpdateMemberRole(m)}
                              disabled={savingMember}
                              className="p-1.5 bg-[#003D7A] text-white rounded-lg hover:bg-[#002b56] transition cursor-pointer"
                              title="Save Role"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingMemberId(null)}
                              className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingMemberId(m.id);
                                setEditingRoleTag(m.roleTag);
                                setEditingCustomTitle(m.customTitle || "");
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit Tag</span>
                            </button>
                            <button
                              onClick={() => handleRemoveMember(m)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Remove Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 bg-slate-50 -mx-6 -mt-6 p-6 rounded-t-2xl">
              <h3 className="text-base font-bold text-gray-900">
                {editingCommunity ? "Edit Community Details" : "Create New Community"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Community Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Robotics Club"
                    className="w-full text-[#012140] p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">URL Slug</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="robotics-club"
                    className="w-full text-[#012140] p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-[#012140] p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A] bg-white"
                  >
                    {COMMUNITY_CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {currentUserRole === "ADMIN" || currentUserRole === "SUPER_ADMIN" ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Campus Assignment (Super Admin Only)</label>
                    <select
                      value={campusId}
                      onChange={(e) => setCampusId(e.target.value)}
                      className="w-full text-[#012140] p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A] bg-white"
                    >
                      <option value="">Global (All Campuses)</option>
                      {campuses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Campus Scope</label>
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                      {campuses.find((c) => c.id === (editingCommunity?.campusId || userCampusId))?.name || "Assigned Campus"}
                    </div>
                  </div>
                )}
              </div>

              {/* Logo & Banner File Uploaders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Logo Avatar Image</label>
                  <ImageUploader
                    value={logoUrl}
                    onChange={setLogoUrl}
                    placeholder="Upload logo avatar"
                    folder="communities/logos"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Banner Cover Image</label>
                  <ImageUploader
                    value={bannerUrl}
                    onChange={setBannerUrl}
                    placeholder="Upload banner cover"
                    folder="communities/banners"
                  />
                </div>
              </div>

              {/* Description Markdown Editor */}
              <MarkdownEditor label="Description (Markdown)" value={description} onChange={setDescription} rows={5} />

              {/* External Links Fields */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#003D7A]" /> External Group & Social Links
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Website URL"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs text-[#012140]"
                  />
                  <input
                    type="text"
                    placeholder="WhatsApp Group Link"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs text-[#012140]"
                  />
                  <input
                    type="text"
                    placeholder="Telegram Channel Link"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs text-[#012140]"
                  />
                  <input
                    type="text"
                    placeholder="LinkedIn Page Link"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs text-[#012140]"
                  />
                  <input
                    type="text"
                    placeholder="GitHub Repo Link"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs text-[#012140]"
                  />
                  <input
                    type="text"
                    placeholder="Discord Invite Link"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs text-[#012140]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer transition-all"
                >
                  {submitting ? "Saving..." : "Save Community"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
