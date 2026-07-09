'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Images,
  BarChart3,
  UserSquare2,
  CalendarDays,
  Newspaper,
  Quote,
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  Save,
  Check,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  Sliders,
  Eye,
  Search,
  Video
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ImageUploader } from '@/components/ImageUploader';

// Import server actions
import {
  getHeroSlidesAction,
  createHeroSlideAction,
  updateHeroSlideAction,
  deleteHeroSlideAction,
  
  getStatsAction,
  createStatAction,
  updateStatAction,
  deleteStatAction,
  
  getWelcomeMsgAction,
  saveWelcomeMsgAction,
  
  getLandingEventsAction,
  toggleEventLandingAction,
  
  getNewsAction,
  createNewsAction,
  updateNewsAction,
  deleteNewsAction,
  
  getTestimonialsAction,
  createTestimonialAction,
  updateTestimonialAction,
  deleteTestimonialAction,
  
  getAlbumsWithImagesAction,
  toggleAlbumImageLandingAction,

  getVideosAction,
  createVideoAction,
  updateVideoAction,
  deleteVideoAction
} from '@/actions/landing-page';

// Predefined icons list for stats selection
const STAT_ICONS = [
  { value: 'Users', label: 'Alumni (Users)' },
  { value: 'GraduationCap', label: 'Campuses (GraduationCap)' },
  { value: 'School', label: 'Colleges (School)' },
  { value: 'Globe', label: 'Countries (Globe)' },
  { value: 'Calendar', label: 'Events (Calendar)' },
  { value: 'Award', label: 'Achievements (Award)' },
  { value: 'Briefcase', label: 'Jobs (Briefcase)' },
  { value: 'Building2', label: 'Companies (Building2)' },
];

export default function WebUpdatePage() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<'hero' | 'stats' | 'welcome' | 'events' | 'news' | 'testimonials' | 'gallery' | 'videos'>('hero');

  // Edit / Form states
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Search filter states
  const [eventSearch, setEventSearch] = useState('');
  const [gallerySearch, setGallerySearch] = useState('');

  // 1. Hero Slide Form State
  const [heroForm, setHeroForm] = useState({
    imageUrl: '',
    headline: '',
    subtext: '',
    displayOrder: 0,
    isActive: true
  });

  // 2. Stats Form State
  const [statForm, setStatForm] = useState({
    number: '',
    label: '',
    icon: 'Users',
    displayOrder: 0,
    isActive: true
  });

  // 3. Welcome Form State
  const [welcomeForm, setWelcomeForm] = useState({
    title: '',
    body: '',
    photo: '',
    name: '',
    designation: ''
  });

  // 5. News Form State
  const [newsForm, setNewsForm] = useState({
    title: '',
    summary: '',
    body: '',
    coverImage: '',
    category: 'Placements',
    author: 'Media Relations Cell',
    publishedDate: new Date().toISOString().split('T')[0],
    campusTag: 'Main Campus',
    featured: false,
    isActive: true
  });

  // 6. Testimonial Form State
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    photo: '',
    batchYear: 2020,
    branch: 'Computer Science & Engineering',
    designation: 'Software Engineer',
    company: '',
    quote: '',
    linkedIn: '',
    isSpotlight: false,
    isActive: true,
    displayOrder: 0
  });

  // 7. Video Form State
  const [videoForm, setVideoForm] = useState({
    videoUrl: '',
    title: '',
    description: '',
    displayOrder: 0,
    isActive: true
  });

  // ───────────────────────────────────────────────────────────────────────────
  // QUERIES
  // ───────────────────────────────────────────────────────────────────────────

  const { data: heroData, isLoading: loadingHeros } = useQuery({
    queryKey: ['landing-heros'],
    queryFn: () => getHeroSlidesAction()
  });

  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ['landing-stats'],
    queryFn: () => getStatsAction()
  });

  const { data: welcomeData, isLoading: loadingWelcome, refetch: refetchWelcome } = useQuery({
    queryKey: ['landing-welcome'],
    queryFn: () => getWelcomeMsgAction()
  });

  const { data: eventsData, isLoading: loadingEvents } = useQuery({
    queryKey: ['landing-events'],
    queryFn: () => getLandingEventsAction()
  });

  const { data: newsData, isLoading: loadingNews } = useQuery({
    queryKey: ['landing-news'],
    queryFn: () => getNewsAction()
  });

  const { data: testimonialsData, isLoading: loadingTestimonials } = useQuery({
    queryKey: ['landing-testimonials'],
    queryFn: () => getTestimonialsAction()
  });

  const { data: galleryData, isLoading: loadingGallery } = useQuery({
    queryKey: ['landing-gallery'],
    queryFn: () => getAlbumsWithImagesAction()
  });

  const { data: videosData, isLoading: loadingVideos } = useQuery({
    queryKey: ['landing-videos'],
    queryFn: () => getVideosAction()
  });

  // Initialize Welcome form when welcome data loads
  useEffect(() => {
    if (welcomeData?.success && welcomeData.welcome) {
      setWelcomeForm({
        title: welcomeData.welcome.title || '',
        body: welcomeData.welcome.body || '',
        photo: welcomeData.welcome.photo || '',
        name: welcomeData.welcome.name || '',
        designation: welcomeData.welcome.designation || ''
      });
    }
  }, [welcomeData]);

  // Reset forms helper
  const resetForm = () => {
    setEditingItem(null);
    setShowAddForm(false);
    setHeroForm({ imageUrl: '', headline: '', subtext: '', displayOrder: 0, isActive: true });
    setStatForm({ number: '', label: '', icon: 'Users', displayOrder: 0, isActive: true });
    setNewsForm({
      title: '',
      summary: '',
      body: '',
      coverImage: '',
      category: 'Placements',
      author: 'Media Relations Cell',
      publishedDate: new Date().toISOString().split('T')[0],
      campusTag: 'Main Campus',
      featured: false,
      isActive: true
    });
    setTestimonialForm({
      name: '',
      photo: '',
      batchYear: 2020,
      branch: 'Computer Science & Engineering',
      designation: 'Software Engineer',
      company: '',
      quote: '',
      linkedIn: '',
      isSpotlight: false,
      isActive: true,
      displayOrder: 0
    });
    setVideoForm({
      videoUrl: '',
      title: '',
      description: '',
      displayOrder: 0,
      isActive: true
    });
  };

  // ───────────────────────────────────────────────────────────────────────────
  // MUTATIONS (CRUD OPERATIONS)
  // ───────────────────────────────────────────────────────────────────────────

  // General invalidate helper
  const invalidateKey = (key: string) => {
    queryClient.invalidateQueries({ queryKey: [key] });
  };

  // --- Hero Slider ---
  const saveHeroMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingItem) {
        return updateHeroSlideAction(editingItem.id, data);
      }
      return createHeroSlideAction(data);
    },
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success(editingItem ? 'Slide updated successfully!' : 'Slide added successfully!');
        invalidateKey('landing-heros');
        resetForm();
      } else {
        toast.error(res.error || 'Failed to save slide');
      }
    },
    onError: () => toast.error('Something went wrong')
  });

  const deleteHeroMutation = useMutation({
    mutationFn: (id: string) => deleteHeroSlideAction(id),
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success('Slide deleted successfully!');
        invalidateKey('landing-heros');
      } else {
        toast.error(res.error || 'Failed to delete slide');
      }
    }
  });

  // --- Stats ---
  const saveStatMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingItem) {
        return updateStatAction(editingItem.id, data);
      }
      return createStatAction(data);
    },
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success(editingItem ? 'Stat updated successfully!' : 'Stat added successfully!');
        invalidateKey('landing-stats');
        resetForm();
      } else {
        toast.error(res.error || 'Failed to save stat');
      }
    }
  });

  const deleteStatMutation = useMutation({
    mutationFn: (id: string) => deleteStatAction(id),
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success('Stat deleted successfully!');
        invalidateKey('landing-stats');
      } else {
        toast.error(res.error || 'Failed to delete stat');
      }
    }
  });

  // --- Welcome ---
  const saveWelcomeMutation = useMutation({
    mutationFn: (data: any) => saveWelcomeMsgAction(data),
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success('Welcome message updated successfully!');
        invalidateKey('landing-welcome');
      } else {
        toast.error(res.error || 'Failed to save welcome message');
      }
    }
  });

  // --- Events Toggle (Optimistic) ---
  const toggleEventMutation = useMutation({
    mutationFn: ({ id, show }: { id: string; show: boolean }) => toggleEventLandingAction(id, show),
    onMutate: async ({ id, show }) => {
      // Cancel any in-flight refetches
      await queryClient.cancelQueries({ queryKey: ['landing-events'] });
      // Snapshot current cache
      const previous = queryClient.getQueryData(['landing-events']);
      // Optimistically flip the checkbox in the cache
      queryClient.setQueryData(['landing-events'], (old: any) => {
        if (!old?.events) return old;
        return {
          ...old,
          events: old.events.map((ev: any) =>
            ev.id === id ? { ...ev, showOnLanding: show } : ev
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Roll back to the previous cache snapshot
      if (context?.previous) {
        queryClient.setQueryData(['landing-events'], context.previous);
      }
      toast.error('Failed to update event visibility');
    },
    onSuccess: (res: any) => {
      if (!res.success) {
        toast.error(res.error || 'Failed to update visibility');
      }
    },
    onSettled: () => {
      // Always re-sync with server after mutation settles
      queryClient.invalidateQueries({ queryKey: ['landing-events'] });
    },
  });

  // --- News ---
  const saveNewsMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingItem) {
        return updateNewsAction(editingItem.id, data);
      }
      return createNewsAction(data);
    },
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success(editingItem ? 'News item updated!' : 'News item published!');
        invalidateKey('landing-news');
        resetForm();
      } else {
        toast.error(res.error || 'Failed to save news');
      }
    }
  });

  const deleteNewsMutation = useMutation({
    mutationFn: (id: string) => deleteNewsAction(id),
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success('News item deleted!');
        invalidateKey('landing-news');
      } else {
        toast.error(res.error || 'Failed to delete news');
      }
    }
  });

  // --- Testimonial ---
  const saveTestimonialMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingItem) {
        return updateTestimonialAction(editingItem.id, data);
      }
      return createTestimonialAction(data);
    },
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success(editingItem ? 'Testimonial updated!' : 'Testimonial added!');
        invalidateKey('landing-testimonials');
        resetForm();
      } else {
        toast.error(res.error || 'Failed to save testimonial');
      }
    }
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: (id: string) => deleteTestimonialAction(id),
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success('Testimonial deleted successfully!');
        invalidateKey('landing-testimonials');
      } else {
        toast.error(res.error || 'Failed to delete testimonial');
      }
    }
  });

  // --- Gallery Toggle (Optimistic) ---
  const toggleGalleryMutation = useMutation({
    mutationFn: ({ id, show }: { id: string; show: boolean }) => toggleAlbumImageLandingAction(id, show),
    onMutate: async ({ id, show }) => {
      await queryClient.cancelQueries({ queryKey: ['landing-gallery'] });
      const previous = queryClient.getQueryData(['landing-gallery']);
      // Optimistically flip the image's showOnLanding inside nested albums
      queryClient.setQueryData(['landing-gallery'], (old: any) => {
        if (!old?.albums) return old;
        return {
          ...old,
          albums: old.albums.map((album: any) => ({
            ...album,
            images: album.images?.map((img: any) =>
              img.id === id ? { ...img, showOnLanding: show } : img
            ),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['landing-gallery'], context.previous);
      }
      toast.error('Failed to toggle image visibility');
    },
    onSuccess: (res: any) => {
      if (!res.success) {
        toast.error(res.error || 'Failed to toggle visibility');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-gallery'] });
    },
  });

  // --- Videos ---
  const saveVideoMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingItem) {
        return updateVideoAction(editingItem.id, data);
      }
      return createVideoAction(data);
    },
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success(editingItem ? 'Video updated successfully!' : 'Video added successfully!');
        invalidateKey('landing-videos');
        resetForm();
      } else {
        toast.error(res.error || 'Failed to save video');
      }
    },
    onError: () => toast.error('Something went wrong')
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (id: string) => deleteVideoAction(id),
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success('Video deleted successfully!');
        invalidateKey('landing-videos');
      } else {
        toast.error(res.error || 'Failed to delete video');
      }
    },
    onError: () => toast.error('Something went wrong')
  });

  // ───────────────────────────────────────────────────────────────────────────
  // UI HANDLERS
  // ───────────────────────────────────────────────────────────────────────────

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    setShowAddForm(false);
    
    if (activeSection === 'hero') {
      setHeroForm({
        imageUrl: item.imageUrl,
        headline: item.headline || '',
        subtext: item.subtext || '',
        displayOrder: item.displayOrder || 0,
        isActive: item.isActive ?? true
      });
    } else if (activeSection === 'stats') {
      setStatForm({
        number: item.number,
        label: item.label,
        icon: item.icon || 'Users',
        displayOrder: item.displayOrder || 0,
        isActive: item.isActive ?? true
      });
    } else if (activeSection === 'news') {
      setNewsForm({
        title: item.title,
        summary: item.summary,
        body: item.body || '',
        coverImage: item.coverImage || '',
        category: item.category,
        author: item.author,
        publishedDate: item.publishedDate,
        campusTag: item.campusTag,
        featured: item.featured ?? false,
        isActive: item.isActive ?? true
      });
    } else if (activeSection === 'testimonials') {
      setTestimonialForm({
        name: item.name,
        photo: item.photo || '',
        batchYear: item.batchYear || 2020,
        branch: item.branch || '',
        designation: item.designation || '',
        company: item.company || '',
        quote: item.quote,
        linkedIn: item.linkedIn || '',
        isSpotlight: item.isSpotlight ?? false,
        isActive: item.isActive ?? true,
        displayOrder: item.displayOrder || 0
      });
    } else if (activeSection === 'videos') {
      setVideoForm({
        videoUrl: item.videoUrl,
        title: item.title || '',
        description: item.description || '',
        displayOrder: item.displayOrder || 0,
        isActive: item.isActive ?? true
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSection === 'hero') {
      if (!heroForm.imageUrl) return toast.error('Cloudinary Hero image is required');
      saveHeroMutation.mutate(heroForm);
    } else if (activeSection === 'stats') {
      if (!statForm.number || !statForm.label) return toast.error('Number and label are required');
      saveStatMutation.mutate(statForm);
    } else if (activeSection === 'news') {
      if (!newsForm.title || !newsForm.summary) return toast.error('Title and Summary are required');
      saveNewsMutation.mutate(newsForm);
    } else if (activeSection === 'testimonials') {
      if (!testimonialForm.name || !testimonialForm.quote) return toast.error('Name and Quote are required');
      saveTestimonialMutation.mutate(testimonialForm);
    } else if (activeSection === 'videos') {
      if (!videoForm.videoUrl || !videoForm.title) return toast.error('Video file and Title are required');
      saveVideoMutation.mutate(videoForm);
    }
  };

  const cards = [
    { id: 'hero', name: 'Hero Carousel', tag: 'Cloudinary Carousel', icon: Images, desc: 'Rotating carousel of hero banner slides' },
    { id: 'stats', name: 'Stats Strip', tag: 'Key Metrics', icon: BarChart3, desc: 'Key figures strip showing campus and network size' },
    { id: 'welcome', name: 'Welcome Msg', tag: 'Leadership Note', icon: UserSquare2, desc: 'VC or director message and photo card' },
    { id: 'events', name: 'Selected Events', tag: 'Event Showcase', icon: CalendarDays, desc: 'Select existing events to show on landing' },
    { id: 'news', name: 'News Updates', tag: 'Campus Bulletins', icon: Newspaper, desc: 'Articles and announcements carousel' },
    { id: 'testimonials', name: 'Alumni Spotlight', tag: 'Alumni Spotlight', icon: Quote, desc: 'Testimonials and spotlight alumni profiles' },
    { id: 'gallery', name: 'Gallery memories', tag: 'Media Showcase', icon: ImageIcon, desc: 'Select album photos to show in landing gallery' },
    { id: 'videos', name: 'Alumni Videos', tag: 'Local Video', icon: Video, desc: 'Display video reels/stories on the landing page' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Globe className="text-[#003D7A]" size={28} />
            Web Update Module
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage dynamic landing page sections, content blocks, Cloudinary media and statistics.
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#003D7A] border border-[#003D7A]/20 hover:bg-slate-550 rounded-xl transition"
          >
            <ExternalLink size={14} />
            Preview Landing Page
          </a>
        </div>
      </div>

      {/* 7 Section Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const isActive = activeSection === card.id;
          return (
            <button
              key={card.id}
              onClick={() => {
                setActiveSection(card.id as any);
                resetForm();
              }}
              className={`text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[140px] group ${
                isActive
                  ? 'bg-[#003D7A] text-white border-transparent shadow-lg shadow-blue-900/10'
                  : 'bg-white hover:bg-slate-50 text-gray-900 border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-2.5 rounded-xl ${
                  isActive ? 'bg-white/10 text-white' : 'bg-slate-50 text-[#003D7A] group-hover:bg-slate-100'
                }`}>
                  <Icon size={20} />
                </div>
                <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-rose-50 text-[#C41E3A]'
                }`}>
                  {card.tag}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider">{card.name}</h3>
                <p className={`text-[10px] line-clamp-2 mt-1 leading-normal font-medium ${isActive ? 'text-white/70' : 'text-slate-500'}`}>
                  {card.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Dynamic CRUD Panel Below */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Panel Header */}
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-base font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Sliders size={18} className="text-[#C41E3A]" />
            Managing: {cards.find((c) => c.id === activeSection)?.name}
          </h2>
          {/* Action button if applicable */}
          {['hero', 'stats', 'news', 'testimonials', 'videos'].includes(activeSection) && !showAddForm && !editingItem && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 px-4 py-2 bg-[#C41E3A] hover:bg-[#a3182f] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              <Plus size={14} />
              Add New
            </button>
          )}
        </div>

        <div className="p-6">
          {/* ──────────────────────────────────────────────────────────────────
              1. HERO CAROUSEL EDITOR
              ────────────────────────────────────────────────────────────────── */}
          {activeSection === 'hero' && (
            <div className="space-y-6">
              {/* Form container */}
              {(showAddForm || editingItem) && (
                <form onSubmit={handleFormSubmit} className="bg-slate-50/50 border border-slate-100 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#003D7A]">
                      {editingItem ? 'Edit Slide Details' : 'Create New Hero Slide'}
                    </h3>
                    <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Cloudinary Hero Image
                        </label>
                        <ImageUploader
                          value={heroForm.imageUrl}
                          onChange={(url) => setHeroForm((prev) => ({ ...prev, imageUrl: url }))}
                          placeholder="Select Hero Carousel Image"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Headline Text</label>
                        <input
                          type="text"
                          value={heroForm.headline}
                          onChange={(e) => setHeroForm((prev) => ({ ...prev, headline: e.target.value }))}
                          placeholder="e.g. Join 10,000+ Distinguished Alumni Network"
                          className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Subtext Description</label>
                        <textarea
                          rows={2}
                          value={heroForm.subtext}
                          onChange={(e) => setHeroForm((prev) => ({ ...prev, subtext: e.target.value }))}
                          placeholder="Provide a subtext paragraph..."
                          className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Display Order</label>
                          <input
                            type="number"
                            value={heroForm.displayOrder}
                            onChange={(e) => setHeroForm((prev) => ({ ...prev, displayOrder: parseInt(e.target.value, 10) }))}
                            className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                          />
                        </div>
                        <div className="flex items-end pb-3">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={heroForm.isActive}
                              onChange={(e) => setHeroForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                              className="rounded border-slate-200 text-[#003D7A] focus:ring-[#003D7A]"
                            />
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Active Slide</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-slate-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveHeroMutation.isPending}
                      className="px-5 py-2 bg-[#003D7A] hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                    >
                      {saveHeroMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      {editingItem ? 'Update Slide' : 'Create Slide'}
                    </button>
                  </div>
                </form>
              )}

              {/* Slide List */}
              {loadingHeros ? (
                <div className="text-center py-12 text-slate-500 font-semibold">Loading Hero slides...</div>
              ) : heroData?.slides?.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-semibold border border-dashed border-slate-200 rounded-2xl">
                  No slides uploaded. Adding slides will override default landing page slides.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {heroData?.slides?.map((slide: any) => (
                    <div key={slide.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-white hover:shadow-md transition">
                      <div className="h-44 bg-slate-100 relative">
                        <img src={slide.imageUrl} alt={slide.headline || ''} className="w-full h-full object-cover" />
                        <span className={`absolute top-3 left-3 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white shadow-sm ${
                          slide.isActive ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}>
                          {slide.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[9px] font-bold">
                          Order: {slide.displayOrder}
                        </span>
                      </div>
                      <div className="p-4 space-y-2">
                        <h4 className="font-extrabold text-sm text-gray-900 line-clamp-1">{slide.headline || 'No Headline'}</h4>
                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{slide.subtext || 'No Subtext'}</p>
                        <p className="text-[10px] text-rose-600 font-extrabold tracking-wider uppercase bg-rose-50 px-2 py-1 rounded inline-block">
                          CTA Redirects: Login Page (Static)
                        </p>
                        
                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-50">
                          <button
                            onClick={() => handleEditClick(slide)}
                            className="p-1.5 text-[#003D7A] hover:bg-blue-50 rounded-lg transition"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this slide?')) {
                                deleteHeroMutation.mutate(slide.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              2. STATS STRIP EDITOR
              ────────────────────────────────────────────────────────────────── */}
          {activeSection === 'stats' && (
            <div className="space-y-6">
              {/* Form container */}
              {(showAddForm || editingItem) && (
                <form onSubmit={handleFormSubmit} className="bg-slate-50/50 border border-slate-100 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#003D7A]">
                      {editingItem ? 'Edit Stat Item' : 'Add New Stat Metric'}
                    </h3>
                    <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Count / Number</label>
                      <input
                        type="text"
                        required
                        value={statForm.number}
                        onChange={(e) => setStatForm((prev) => ({ ...prev, number: e.target.value }))}
                        placeholder="e.g. 10,000+ or 6"
                        className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Label Title</label>
                      <input
                        type="text"
                        required
                        value={statForm.label}
                        onChange={(e) => setStatForm((prev) => ({ ...prev, label: e.target.value }))}
                        placeholder="e.g. Registered Alumni"
                        className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Lucide Icon</label>
                      <select
                        value={statForm.icon}
                        onChange={(e) => setStatForm((prev) => ({ ...prev, icon: e.target.value }))}
                        className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none bg-white"
                      >
                        {STAT_ICONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Display Order</label>
                      <input
                        type="number"
                        value={statForm.displayOrder}
                        onChange={(e) => setStatForm((prev) => ({ ...prev, displayOrder: parseInt(e.target.value, 10) }))}
                        className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="flex items-end pb-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={statForm.isActive}
                          onChange={(e) => setStatForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                          className="rounded border-slate-200 text-[#003D7A] focus:ring-[#003D7A]"
                        />
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Active Stat</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-slate-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-slate-550 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveStatMutation.isPending}
                      className="px-5 py-2 bg-[#003D7A] hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                    >
                      {saveStatMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      {editingItem ? 'Update Stat' : 'Add Stat'}
                    </button>
                  </div>
                </form>
              )}

              {/* Stats List */}
              {loadingStats ? (
                <div className="text-center py-12 text-slate-500 font-semibold">Loading stats...</div>
              ) : statsData?.stats?.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-semibold border border-dashed border-slate-200 rounded-2xl">
                  No custom statistics created. Standard defaults will be showcased on landing.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4">Order</th>
                        <th className="py-3 px-4">Metric</th>
                        <th className="py-3 px-4">Label</th>
                        <th className="py-3 px-4">Icon</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData?.stats?.map((stat: any) => (
                        <tr key={stat.id} className="border-b border-slate-50 hover:bg-slate-50/50 text-sm">
                          <td className="py-3.5 px-4 font-bold text-gray-700">{stat.displayOrder}</td>
                          <td className="py-3.5 px-4 font-extrabold text-gray-900">{stat.number}</td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{stat.label}</td>
                          <td className="py-3.5 px-4 font-mono text-xs text-indigo-600 font-semibold">{stat.icon}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              stat.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-500'
                            }`}>
                              {stat.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEditClick(stat)}
                                className="p-1.5 text-[#003D7A] hover:bg-blue-50 rounded-lg transition"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this statistic?')) {
                                    deleteStatMutation.mutate(stat.id);
                                  }
                                }}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              3. WELCOME MESSAGE EDITOR
              ────────────────────────────────────────────────────────────────── */}
          {activeSection === 'welcome' && (
            <div className="space-y-6">
              {loadingWelcome ? (
                <div className="text-center py-12 text-slate-500 font-semibold">Loading Welcome note...</div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!welcomeForm.title || !welcomeForm.body || !welcomeForm.photo || !welcomeForm.name) {
                      return toast.error('All Welcome Message fields are required');
                    }
                    saveWelcomeMutation.mutate(welcomeForm);
                  }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Details Column */}
                    <div className="lg:col-span-8 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Section Headline Title</label>
                        <input
                          type="text"
                          required
                          value={welcomeForm.title}
                          onChange={(e) => setWelcomeForm((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g. Welcome to the IKGPTU Alumni Family"
                          className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Welcome Note Message (HTML/Paragraphs supported)</label>
                        <textarea
                          rows={6}
                          required
                          value={welcomeForm.body}
                          onChange={(e) => setWelcomeForm((prev) => ({ ...prev, body: e.target.value }))}
                          placeholder="Write message using <p class='mb-4'>...</p> syntax to split paragraphs cleanly"
                          className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A] font-mono text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Author Name</label>
                          <input
                            type="text"
                            required
                            value={welcomeForm.name}
                            onChange={(e) => setWelcomeForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. Dr. Susheel Mittal"
                            className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Author Designation</label>
                          <input
                            type="text"
                            required
                            value={welcomeForm.designation}
                            onChange={(e) => setWelcomeForm((prev) => ({ ...prev, designation: e.target.value }))}
                            placeholder="e.g. Vice Chancellor, IKGPTU"
                            className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Photo Column */}
                    <div className="lg:col-span-4 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Leadership Photo (Cloudinary)</label>
                        <ImageUploader
                          value={welcomeForm.photo}
                          onChange={(url) => setWelcomeForm((prev) => ({ ...prev, photo: url }))}
                          placeholder="Select Photo of Leadership"
                        />
                      </div>

                      {welcomeForm.photo && (
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-3">
                          <img src={welcomeForm.photo} alt={welcomeForm.name} className="w-14 h-14 rounded-full object-cover border border-slate-200" />
                          <div>
                            <p className="text-xs font-extrabold text-gray-900">{welcomeForm.name || 'Anonymous'}</p>
                            <p className="text-[10px] text-slate-500 font-bold">{welcomeForm.designation || 'No Designation'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={saveWelcomeMutation.isPending}
                      className="px-6 py-2.5 bg-[#003D7A] hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                    >
                      {saveWelcomeMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      Save Leadership Welcome Note
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              4. EVENTS CHECKLIST SHOWCASE
              ────────────────────────────────────────────────────────────────── */}
          {activeSection === 'events' && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3 text-xs text-blue-900">
                <CalendarDays size={18} className="text-[#003D7A]" />
                <p className="font-semibold">
                  Below are all the events currently posted in the system. Check the <b>Show on Landing</b> boxes to make specific events display on the landing page section.
                </p>
              </div>

              {/* Filters */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search events in system..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="w-full text-[#012140] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#003D7A] focus:bg-white focus:outline-none rounded-xl text-sm transition"
                />
              </div>

              {/* Event Checklist List */}
              {loadingEvents ? (
                <div className="text-center py-12 text-slate-500 font-semibold">Loading events database...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4">Show on Landing</th>
                        <th className="py-3 px-4">Event Title</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Event Date</th>
                        <th className="py-3 px-4">Venue</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventsData?.events
                        ?.filter((e: any) => e.title.toLowerCase().includes(eventSearch.toLowerCase()))
                        ?.map((event: any) => (
                          <tr key={event.id} className="border-b border-slate-50 hover:bg-slate-50/50 text-sm">
                            <td className="py-3.5 px-4">
                              <label className="flex items-center cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={event.showOnLanding}
                                  onChange={(e) => {
                                    toggleEventMutation.mutate({ id: event.id, show: e.target.checked });
                                  }}
                                  className="rounded border-slate-300 text-[#003D7A] focus:ring-[#003D7A] h-4.5 w-4.5 cursor-pointer"
                                />
                                <span className="sr-only">Toggle Landing Visibility</span>
                              </label>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-gray-900">{event.title}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-0.5 rounded bg-blue-50 text-[#003D7A] text-[10px] font-bold uppercase tracking-wider">
                                {event.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-slate-500">
                              {new Date(event.eventDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-medium text-[#012140] truncate max-w-[200px]">
                              {event.venue}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                event.isPublished ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {event.isPublished ? 'Published' : 'Draft'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              5. NEWS / UPDATES EDITOR
              ────────────────────────────────────────────────────────────────── */}
          {activeSection === 'news' && (
            <div className="space-y-6">
              {/* Form container */}
              {(showAddForm || editingItem) && (
                <form onSubmit={handleFormSubmit} className="bg-slate-50/50 border border-slate-100 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#003D7A]">
                      {editingItem ? 'Edit News Details' : 'Create & Post News Update'}
                    </h3>
                    <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Cover Image
                        </label>
                        <ImageUploader
                          value={newsForm.coverImage}
                          onChange={(url) => setNewsForm((prev) => ({ ...prev, coverImage: url }))}
                          placeholder="Select cover photo for this news"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">News Title</label>
                        <input
                          type="text"
                          required
                          value={newsForm.title}
                          onChange={(e) => setNewsForm((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g. IKGPTU Bags Outstanding Placement Award"
                          className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Short Summary</label>
                        <textarea
                          rows={3}
                          required
                          value={newsForm.summary}
                          onChange={(e) => setNewsForm((prev) => ({ ...prev, summary: e.target.value }))}
                          placeholder="Brief description showing on cards (max 200 characters)..."
                          className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Category Tag</label>
                          <input
                            type="text"
                            required
                            value={newsForm.category}
                            onChange={(e) => setNewsForm((prev) => ({ ...prev, category: e.target.value }))}
                            placeholder="e.g. Placements"
                            className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Campus Tag</label>
                          <input
                            type="text"
                            required
                            value={newsForm.campusTag}
                            onChange={(e) => setNewsForm((prev) => ({ ...prev, campusTag: e.target.value }))}
                            placeholder="e.g. Main Campus"
                            className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Published By</label>
                          <input
                            type="text"
                            required
                            value={newsForm.author}
                            onChange={(e) => setNewsForm((prev) => ({ ...prev, author: e.target.value }))}
                            placeholder="Media Relations Cell"
                            className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Published Date</label>
                          <input
                            type="date"
                            required
                            value={newsForm.publishedDate}
                            onChange={(e) => setNewsForm((prev) => ({ ...prev, publishedDate: e.target.value }))}
                            className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-6 pb-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newsForm.featured}
                            onChange={(e) => setNewsForm((prev) => ({ ...prev, featured: e.target.checked }))}
                            className="rounded border-slate-200 text-[#003D7A]"
                          />
                          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">★ Featured News</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newsForm.isActive}
                            onChange={(e) => setNewsForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                            className="rounded border-slate-200 text-[#003D7A]"
                          />
                          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Active Visibility</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-slate-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveNewsMutation.isPending}
                      className="px-5 py-2 bg-[#003D7A] hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                    >
                      {saveNewsMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      {editingItem ? 'Update News' : 'Publish News'}
                    </button>
                  </div>
                </form>
              )}

              {/* News list */}
              {loadingNews ? (
                <div className="text-center py-12 text-slate-500 font-semibold">Loading news...</div>
              ) : newsData?.news?.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-semibold border border-dashed border-slate-200 rounded-2xl">
                  No dynamic news updates added. Defaults will show on landing.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {newsData?.news?.map((newsItem: any) => (
                    <div key={newsItem.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-white hover:shadow-md transition flex flex-col h-full">
                      <div className="h-44 bg-slate-100 relative flex-shrink-0">
                        <img src={newsItem.coverImage || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644'} alt={newsItem.title} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white shadow-sm ${
                            newsItem.isActive ? 'bg-emerald-500' : 'bg-slate-500'
                          }`}>
                            {newsItem.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {newsItem.featured && (
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white bg-amber-500 shadow-sm flex items-center gap-0.5">
                              ★ Featured
                            </span>
                          )}
                        </div>
                        <span className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                          {newsItem.category}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col flex-grow space-y-2">
                        <div className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                          {newsItem.publishedDate} • By {newsItem.author}
                        </div>
                        <h4 className="font-extrabold text-sm text-gray-900 line-clamp-1">{newsItem.title}</h4>
                        <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed flex-grow">{newsItem.summary}</p>
                        <p className="text-[9px] font-bold text-[#C41E3A] uppercase tracking-widest mt-1">
                          📍 {newsItem.campusTag}
                        </p>
                        
                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-50">
                          <button
                            onClick={() => handleEditClick(newsItem)}
                            className="p-1.5 text-[#003D7A] hover:bg-blue-50 rounded-lg transition"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this news post?')) {
                                deleteNewsMutation.mutate(newsItem.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              6. TESTIMONIALS & SPOTLIGHTS EDITOR
              ────────────────────────────────────────────────────────────────── */}
          {activeSection === 'testimonials' && (
            <div className="space-y-6">
              {/* Info panel */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-700 flex items-center gap-3">
                <Quote size={18} className="text-[#C41E3A]" />
                <p className="font-semibold">
                  Testimonials and Notable Alumni Spotlights are combined here. Turn on the <b>Spotlight Mode</b> toggle to display them as featured cards in the Alumni Spotlight / Hall of Fame section. General testimonials show in the Testimonials carousel.
                </p>
              </div>

              {/* Form container */}
              {(showAddForm || editingItem) && (
                <form onSubmit={handleFormSubmit} className="bg-slate-50/50 border border-slate-100 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#003D7A]">
                      {editingItem ? 'Edit Profile details' : 'Add Alumni Testimonial / Spotlight'}
                    </h3>
                    <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Alumni Avatar
                        </label>
                        <ImageUploader
                          value={testimonialForm.photo}
                          onChange={(url) => setTestimonialForm((prev) => ({ ...prev, photo: url }))}
                          placeholder="Select Alumni Photo"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-8 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Alumni Name</label>
                          <input
                            type="text"
                            required
                            value={testimonialForm.name}
                            onChange={(e) => setTestimonialForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. Amit Khurana"
                            className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">LinkedIn URL (Optional)</label>
                          <input
                            type="url"
                            value={testimonialForm.linkedIn}
                            onChange={(e) => setTestimonialForm((prev) => ({ ...prev, linkedIn: e.target.value }))}
                            placeholder="https://linkedin.com/in/username"
                            className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Batch Year</label>
                          <input
                            type="number"
                            value={testimonialForm.batchYear}
                            onChange={(e) => setTestimonialForm((prev) => ({ ...prev, batchYear: parseInt(e.target.value, 10) }))}
                            className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Branch</label>
                          <input
                            type="text"
                            value={testimonialForm.branch}
                            onChange={(e) => setTestimonialForm((prev) => ({ ...prev, branch: e.target.value }))}
                            placeholder="Computer Science & Engineering"
                            className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Job Title / Designation</label>
                          <input
                            type="text"
                            value={testimonialForm.designation}
                            onChange={(e) => setTestimonialForm((prev) => ({ ...prev, designation: e.target.value }))}
                            placeholder="Co-Founder & CEO"
                            className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Company / Enterprise</label>
                          <input
                            type="text"
                            value={testimonialForm.company}
                            onChange={(e) => setTestimonialForm((prev) => ({ ...prev, company: e.target.value }))}
                            placeholder="StellarData Systems"
                            className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Quote Message / Bio Summary</label>
                        <textarea
                          rows={3}
                          required
                          value={testimonialForm.quote}
                          onChange={(e) => setTestimonialForm((prev) => ({ ...prev, quote: e.target.value }))}
                          placeholder="Write the alumni testimonial or short bio..."
                          className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Display Order</label>
                          <input
                            type="number"
                            value={testimonialForm.displayOrder}
                            onChange={(e) => setTestimonialForm((prev) => ({ ...prev, displayOrder: parseInt(e.target.value, 10) }))}
                            className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                          />
                        </div>
                        <div className="flex items-end pb-3">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={testimonialForm.isSpotlight}
                              onChange={(e) => setTestimonialForm((prev) => ({ ...prev, isSpotlight: e.target.checked }))}
                              className="rounded border-slate-200 text-[#003D7A]"
                            />
                            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Spotlight Mode</span>
                          </label>
                        </div>
                        <div className="flex items-end pb-3">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={testimonialForm.isActive}
                              onChange={(e) => setTestimonialForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                              className="rounded border-slate-200 text-[#003D7A]"
                            />
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Active Visibility</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-slate-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveTestimonialMutation.isPending}
                      className="px-5 py-2 bg-[#003D7A] hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                    >
                      {saveTestimonialMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      {editingItem ? 'Update Testimonial' : 'Create Testimonial'}
                    </button>
                  </div>
                </form>
              )}

              {/* Testimonials and Spotlight List */}
              {loadingTestimonials ? (
                <div className="text-center py-12 text-slate-500 font-semibold">Loading Testimonials...</div>
              ) : testimonialsData?.testimonials?.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-semibold border border-dashed border-slate-200 rounded-2xl">
                  No testimonials or spotlight cards loaded. Standard defaults will show on landing.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {testimonialsData?.testimonials?.map((t: any) => (
                    <div key={t.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-white hover:shadow-md transition flex flex-col justify-between">
                      <div className="p-5 space-y-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-50 border border-slate-200 flex-shrink-0">
                            <img src={t.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'} alt={t.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-gray-900">{t.name}</h4>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white shadow-sm ${
                                t.isSpotlight ? 'bg-rose-600' : 'bg-blue-600'
                              }`}>
                                {t.isSpotlight ? 'Spotlight' : 'Testimonial'}
                              </span>
                            </div>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                              Class of {t.batchYear || 'N/A'} | {t.branch || 'General'}
                            </p>
                          </div>
                        </div>

                        <p className="text-[#012140] text-xs italic leading-relaxed font-light">
                          &ldquo;{t.quote}&rdquo;
                        </p>

                        {(t.designation || t.company) && (
                          <div className="text-xs bg-slate-50 border border-slate-100 rounded-lg py-1.5 px-3 font-semibold text-gray-700 inline-block">
                            {t.designation} {t.company && `@ ${t.company}`}
                          </div>
                        )}

                        {t.linkedIn && (
                          <a href={t.linkedIn} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-sky-700 flex items-center gap-1">
                            LinkedIn Profile ↗
                          </a>
                        )}
                      </div>

                      <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          t.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'
                        }`}>
                          {t.isActive ? 'Visible' : 'Hidden'}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(t)}
                            className="p-1 text-[#003D7A] hover:bg-blue-50 rounded transition"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this testimonial?')) {
                                deleteTestimonialMutation.mutate(t.id);
                              }
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              7. GALLERY MEMORIES SELECTOR
              ────────────────────────────────────────────────────────────────── */}
          {activeSection === 'gallery' && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3 text-xs text-blue-900">
                <ImageIcon size={18} className="text-[#003D7A]" />
                <p className="font-semibold">
                  Below are all the pictures already uploaded inside admin gallery Albums. Toggle the checkbox on each image card to select and showcase it in the Landing Page memories masonry section.
                </p>
              </div>

              {/* Filters */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Filter images by album title or caption..."
                  value={gallerySearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="w-full text-[#012140] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#003D7A] focus:bg-white focus:outline-none rounded-xl text-sm transition"
                />
              </div>

              {/* Albums & Images */}
              {loadingGallery ? (
                <div className="text-center py-12 text-slate-500 font-semibold">Loading gallery database...</div>
              ) : galleryData?.albums?.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-semibold border border-dashed border-slate-200 rounded-2xl">
                  No photo albums uploaded yet in the system. Go to Posts & Gallery tab to create albums first!
                </div>
              ) : (
                <div className="space-y-8">
                  {galleryData?.albums?.map((album: any) => {
                    const filteredImages = album.images.filter((img: any) => 
                      album.title.toLowerCase().includes(eventSearch.toLowerCase()) || 
                      (img.caption && img.caption.toLowerCase().includes(eventSearch.toLowerCase()))
                    );

                    if (filteredImages.length === 0) return null;

                    return (
                      <div key={album.id} className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                          <h3 className="font-extrabold text-sm text-gray-900">{album.title}</h3>
                          <span className="text-[10px] font-bold text-slate-400">({album.images.length} images)</span>
                          {album.description && (
                            <span className="text-xs text-slate-500 truncate max-w-sm ml-2">- {album.description}</span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {filteredImages.map((img: any) => (
                            <div key={img.id} className="relative group border border-slate-100 rounded-xl overflow-hidden bg-white hover:shadow transition">
                              <div className="h-28 bg-slate-100 relative">
                                <img src={img.imageUrl} alt={img.caption || ''} className="w-full h-full object-cover" />
                                
                                {/* Landing Visibility Checkbox */}
                                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-slate-100">
                                  <label className="flex items-center cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={img.showOnLanding}
                                      onChange={(e) => {
                                        toggleGalleryMutation.mutate({ id: img.id, show: e.target.checked });
                                      }}
                                      className="rounded border-slate-300 text-[#003D7A] focus:ring-[#003D7A] h-4 w-4 cursor-pointer"
                                    />
                                    <span className="sr-only">Toggle Landing Gallery</span>
                                  </label>
                                </div>
                              </div>
                              {img.caption && (
                                <div className="p-2">
                                  <p className="text-[10px] text-gray-700 font-bold truncate leading-tight">{img.caption}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              8. ALUMNI VIDEOS EDITOR
              ────────────────────────────────────────────────────────────────── */}
          {activeSection === 'videos' && (
            <div className="space-y-6">
              {/* Form container */}
              {(showAddForm || editingItem) && (
                <form onSubmit={handleFormSubmit} className="bg-slate-50/50 border border-slate-100 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#003D7A]">
                      {editingItem ? 'Edit Video Details' : 'Add New Video'}
                    </h3>
                    <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Video File (MP4/WebM)
                        </label>
                        <ImageUploader
                          value={videoForm.videoUrl}
                          onChange={(url) => setVideoForm((prev) => ({ ...prev, videoUrl: url }))}
                          folder="admin_videos"
                          accept="video/mp4,video/webm,video/ogg,video/quicktime"
                          placeholder="Select Video from Device"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Video Title</label>
                        <input
                          type="text"
                          required
                          value={videoForm.title}
                          onChange={(e) => setVideoForm((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g. Annual Alumni Fest Highlights"
                          className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Short Description</label>
                        <textarea
                          rows={3}
                          value={videoForm.description}
                          onChange={(e) => setVideoForm((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description showing on landing page..."
                          className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003D7A] resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Display Order</label>
                          <input
                            type="number"
                            value={videoForm.displayOrder}
                            onChange={(e) => setVideoForm((prev) => ({ ...prev, displayOrder: parseInt(e.target.value, 10) }))}
                            className="w-full text-[#012140] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                          />
                        </div>
                        <div className="flex items-end pb-3">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={videoForm.isActive}
                              onChange={(e) => setVideoForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                              className="rounded border-slate-200 text-[#003D7A] focus:ring-[#003D7A]"
                            />
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Active Video</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-slate-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-slate-550 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveVideoMutation.isPending}
                      className="px-5 py-2 bg-[#003D7A] hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {saveVideoMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      {editingItem ? 'Update Video' : 'Add Video'}
                    </button>
                  </div>
                </form>
              )}

              {/* Videos list */}
              {loadingVideos ? (
                <div className="text-center py-12 text-slate-500 font-semibold">Loading videos...</div>
              ) : videosData?.videos?.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-semibold border border-dashed border-slate-200 rounded-2xl">
                  No custom landing page videos uploaded yet. Standard defaults will showcase on landing.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {videosData?.videos?.map((v: any) => (
                    <div key={v.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-white hover:shadow-md transition flex flex-col justify-between">
                      <div className="relative aspect-video bg-slate-950">
                        <video src={v.videoUrl} controls className="w-full h-full object-cover" />
                      </div>
                      <div className="p-5 flex-grow space-y-2">
                        <h4 className="font-extrabold text-sm text-gray-900 leading-snug">{v.title}</h4>
                        {v.description && <p className="text-xs text-slate-500 leading-normal">{v.description}</p>}
                        <div className="text-[10px] text-slate-400 font-bold uppercase pt-1">
                          Display Order: {v.displayOrder}
                        </div>
                      </div>
                      <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          v.isActive ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'bg-slate-50 text-slate-500'
                        }`}>
                          {v.isActive ? 'Visible' : 'Hidden'}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(v)}
                            className="p-1 text-[#003D7A] hover:bg-blue-50 rounded transition cursor-pointer"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this video?')) {
                                deleteVideoMutation.mutate(v.id);
                              }
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
