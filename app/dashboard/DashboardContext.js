'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase.js';

const DashboardContext = createContext(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider');
  return ctx;
}

// Default block data for each type (Link, Heading, Text, Image, Video, Grid, Divider, Spacer, Callout, Socials)
const BLOCK_DEFAULTS = {
  link: {
    title: '',
    subtitle: '',
    url: '',
    icon: 'link',
    animation: 'slideUp',
    hover_effect: 'lift',
    background_type: 'solid',
    background_value: '#ffffff',
    text_color: '#111827',
    is_featured: false,
  },
  heading: { text: 'New Section', size: 'lg' },
  text: { text: 'Write a short bio or announcement note here...' },
  image: { url: '', alt: '', caption: '' },
  video: { url: '', provider: 'youtube' },
  divider: { style: 'line' },
  spacer: { height: 32 },
  grid: { items: [] },
  callout: { text: 'Special announcement or drop details here!', style: 'highlight', icon: 'sparkles' },
  socials_bar: { style: 'pills', align: 'center' },
};

function normalizeForComparison(obj) {
  if (!obj) return '';
  const clean = { ...obj };
  delete clean.published_blocks;
  delete clean.published_profile;
  delete clean.published_at;
  delete clean.updated_at;
  return JSON.stringify(clean);
}

export function DashboardProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [publishedProfile, setPublishedProfile] = useState(null);
  const [publishedBlocks, setPublishedBlocks] = useState([]);
  const [hasUnpostedChanges, setHasUnpostedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Save status & Visual editor selection
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const saveTimeoutRef = useRef(null);

  const markSaved = useCallback(() => {
    setSaveStatus('saved');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('idle');
    }, 2500);
  }, []);

  const markError = useCallback((msg) => {
    setSaveStatus('error');
    setSaveErrorMsg(msg || 'Failed to save changes. Reverted to previous state.');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('idle');
      setSaveErrorMsg('');
    }, 5000);
  }, []);

  // Load profile + blocks directly from database (always 100% fresh, no stale cache)
  const load = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }
      setUserId(session.user.id);

      const [{ data: profileData }, { data: blocksData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
        supabase.from('blocks').select('*').eq('profile_id', session.user.id).order('position'),
      ]);

      const loadedProfile = profileData || null;
      const loadedBlocks = (blocksData || []).map((b) => ({ ...b, is_visible: b.is_visible !== false }));

      setProfile(loadedProfile);
      setBlocks(loadedBlocks);

      // Clean up any legacy cache
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('linkinbio_cached_profile');
          localStorage.removeItem('linkinbio_cached_blocks');
        } catch (_) {}
      }

      // Check published state
      if (loadedProfile) {
        const pubBlocks = loadedProfile.published_blocks || loadedBlocks;
        const pubProfile = loadedProfile.published_profile || loadedProfile;
        setPublishedBlocks(pubBlocks);
        setPublishedProfile(pubProfile);
        setHasUnpostedChanges(false);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        load();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setBlocks([]);
        setUserId(null);
      }
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [load]);

  // Publish changes live to public visitors
  const publishChanges = useCallback(async () => {
    if (!userId || !profile) return false;

    setSaveStatus('saving');
    const publishedAt = new Date().toISOString();

    // Create a clean profile snapshot without circular/redundant properties
    const cleanProfile = { ...profile };
    delete cleanProfile.published_blocks;
    delete cleanProfile.published_profile;
    delete cleanProfile.published_at;

    const nextPublicationStatus =
      !cleanProfile.publication_status || cleanProfile.publication_status === 'draft'
        ? 'published'
        : cleanProfile.publication_status;
    cleanProfile.publication_status = nextPublicationStatus;

    const cleanBlocks = (blocks || []).map((b, idx) => ({
      id: b.id,
      profile_id: userId,
      type: b.type,
      position: typeof b.position === 'number' ? b.position : idx,
      is_visible: b.is_visible !== false,
      is_disabled: b.is_disabled === true,
      data: b.data || {},
    }));

    const updatedProfile = {
      ...profile,
      publication_status: nextPublicationStatus,
      published_blocks: cleanBlocks,
      published_profile: cleanProfile,
      published_at: publishedAt,
    };

    setProfile(updatedProfile);
    setPublishedBlocks(cleanBlocks);
    setPublishedProfile(cleanProfile);
    setHasUnpostedChanges(false);

    try {
      // 1. Update profile with the new published snapshot and latest live fields
      const { error: profileError } = await supabase.from('profiles').update({
        ...cleanProfile,
        publication_status: nextPublicationStatus,
        published_blocks: cleanBlocks,
        published_profile: cleanProfile,
        published_at: publishedAt,
        updated_at: publishedAt,
      }).eq('id', userId);

      if (profileError) {
        console.warn('Primary profile update had error, falling back:', profileError);
        // Fallback update without JSON snapshot columns if schema is legacy
        const { error: fallbackError } = await supabase.from('profiles').update({
          ...cleanProfile,
          publication_status: nextPublicationStatus,
          updated_at: publishedAt,
        }).eq('id', userId);
        if (fallbackError) throw fallbackError;
      }

      // 2. Ensure each block in blocks table is synced and persisted
      if (cleanBlocks.length > 0) {
        const blockResults = await Promise.all(
          cleanBlocks.map((b) =>
            supabase.from('blocks').upsert({
              id: b.id,
              profile_id: userId,
              type: b.type,
              position: b.position,
              is_visible: b.is_visible,
              data: b.data,
            })
          )
        );
        const blockError = blockResults.find((result) => result?.error)?.error;
        if (blockError) throw blockError;
      }

      markSaved();
      return true;
    } catch (err) {
      console.error('Failed to publish changes:', err);
      markError('Failed to publish changes live. Please try again.');
      return false;
    }
  }, [userId, profile, blocks, markSaved, markError]);

  // Add a new block
  const addBlock = useCallback(async (type, dataOverride) => {
    if (!userId) return;
    const prevBlocks = [...blocks];
    const data = { ...(BLOCK_DEFAULTS[type] || {}), ...(dataOverride || {}) };
    const position = blocks.length;

    setSaveStatus('saving');
    let createdBlock = null;

    try {
      const { data: newBlock, error } = await supabase
        .from('blocks')
        .insert({ profile_id: userId, type, position, data, is_visible: true })
        .select()
        .single();
      if (error) throw error;
      if (newBlock) {
        createdBlock = { ...newBlock, is_visible: newBlock.is_visible !== false };
      }

      if (!createdBlock) {
        createdBlock = {
          id: crypto.randomUUID(),
          profile_id: userId,
          type,
          position,
          data,
          is_visible: true,
          created_at: new Date().toISOString(),
        };
      }

      setBlocks((prev) => [...prev, createdBlock]);
      setSelectedBlockId(createdBlock.id);
      setHasUnpostedChanges(true);
      markSaved();
      return createdBlock;
    } catch (err) {
      console.error('Failed to add block:', err);
      setBlocks(prevBlocks);
      markError('Failed to add new block. Reverted.');
    }
  }, [userId, blocks, markSaved, markError]);

  // Update a block's data with rollback on error
  const updateBlock = useCallback(async (id, patch) => {
    const prevBlocks = [...blocks];
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...patch } } : b)));
    setHasUnpostedChanges(true);
    setSaveStatus('saving');

    try {
      const block = blocks.find((b) => b.id === id);
      if (block) {
        const { error } = await supabase.from('blocks').update({ data: { ...block.data, ...patch } }).eq('id', id);
        if (error) throw error;
      }
      markSaved();
    } catch (err) {
      console.error('Failed to update block:', err);
      setBlocks(prevBlocks);
      markError('Failed to save link edit. Reverted to previous state.');
    }
  }, [blocks, markSaved, markError]);

  // Update block visibility with rollback on error
  const toggleBlockVisibility = useCallback(async (id) => {
    const prevBlocks = [...blocks];
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const next = b.is_visible === false ? true : false;
          return { ...b, is_visible: next };
        }
        return b;
      })
    );
    setHasUnpostedChanges(true);
    setSaveStatus('saving');

    try {
      const block = blocks.find((b) => b.id === id);
      if (block) {
        const nextVis = block.is_visible === false ? true : false;
        const { error } = await supabase.from('blocks').update({ is_visible: nextVis }).eq('id', id);
        if (error) throw error;
      }
      markSaved();
    } catch (err) {
      console.error('Failed to toggle block visibility:', err);
      setBlocks(prevBlocks);
      markError('Failed to update visibility. Reverted.');
    }
  }, [blocks, markSaved, markError]);

  // Delete a block with rollback on error
  const deleteBlock = useCallback(async (id) => {
    const prevBlocks = [...blocks];
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
    setHasUnpostedChanges(true);
    setSaveStatus('saving');

    try {
      const { error } = await supabase.from('blocks').delete().eq('id', id);
      if (error) throw error;
      markSaved();
    } catch (err) {
      console.error('Failed to delete block:', err);
      setBlocks(prevBlocks);
      markError('Failed to delete block. Reverted.');
    }
  }, [blocks, selectedBlockId, markSaved, markError]);

  // Reorder blocks (after drag-and-drop) with rollback on error
  const reorderBlocks = useCallback(async (newBlocks) => {
    const prevBlocks = [...blocks];
    const reordered = newBlocks.map((b, i) => ({ ...b, position: i }));
    setBlocks(reordered);
    setHasUnpostedChanges(true);
    setSaveStatus('saving');

    try {
      await Promise.all(
        reordered.map((b, i) => supabase.from('blocks').update({ position: i }).eq('id', b.id))
      );
      markSaved();
    } catch (err) {
      console.error('Failed to reorder blocks:', err);
      setBlocks(prevBlocks);
      markError('Failed to save block reordering. Reverted.');
    }
  }, [blocks, markSaved, markError]);

  // Update profile with rollback on error
  const updateProfile = useCallback(async (patch) => {
    const prevProfile = profile ? { ...profile } : null;
    setProfile((prev) => ({ ...prev, ...patch }));
    setHasUnpostedChanges(true);
    setSaveStatus('saving');

    try {
      if (profile) {
        const { error } = await supabase.from('profiles').update(patch).eq('id', profile.id);
        if (error) throw error;
      }
      markSaved();
    } catch (err) {
      console.error('Failed to update profile:', err);
      if (prevProfile) setProfile(prevProfile);
      markError('Failed to update profile styling. Reverted.');
    }
  }, [profile, markSaved, markError]);

  return (
    <DashboardContext.Provider
      value={{
        profile,
        setProfile,
        blocks,
        setBlocks,
        publishedProfile,
        publishedBlocks,
        hasUnpostedChanges,
        publishChanges,
        loading,
        userId,
        saveStatus,
        saveErrorMsg,
        selectedBlockId,
        setSelectedBlockId,
        addBlock,
        updateBlock,
        toggleBlockVisibility,
        deleteBlock,
        reorderBlocks,
        updateProfile,
        load,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
