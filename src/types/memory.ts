export interface Memory {
  id: string;
  fact: string;
  category: string;
  importance: number;
  confidence: number;
  status: 'active' | 'archived' | 'superseded';
  source_message_id: string | null;
  superseded_by: string | null;
  created_at: string;
  updated_at: string;
}

export type MemoryCategory = 'personal' | 'preference' | 'work' | 'people' | 'relationship' | 'goal' | 'project' | 'event' | 'habit' | 'health' | 'general';

export const CATEGORY_META: Record<MemoryCategory, { label: string; icon: string; color: string }> = {
  personal:     { label: 'Personal',      icon: '👤', color: 'bg-blue-100 text-blue-700' },
  preference:   { label: 'Preference',    icon: '⭐', color: 'bg-amber-100 text-amber-700' },
  work:         { label: 'Work',          icon: '💼', color: 'bg-violet-100 text-violet-700' },
  people:       { label: 'People',        icon: '👥', color: 'bg-pink-100 text-pink-700' },
  relationship: { label: 'Relationship',  icon: '❤️', color: 'bg-rose-100 text-rose-700' },
  goal:         { label: 'Goal',          icon: '🎯', color: 'bg-emerald-100 text-emerald-700' },
  project:      { label: 'Project',       icon: '📋', color: 'bg-cyan-100 text-cyan-700' },
  event:        { label: 'Event',         icon: '📅', color: 'bg-orange-100 text-orange-700' },
  habit:        { label: 'Habit',         icon: '🔄', color: 'bg-indigo-100 text-indigo-700' },
  health:       { label: 'Health',        icon: '💚', color: 'bg-green-100 text-green-700' },
  general:      { label: 'General',       icon: '📝', color: 'bg-gray-100 text-gray-700' },
};

export function getCategoryMeta(category: string) {
  return CATEGORY_META[category as MemoryCategory] || CATEGORY_META.general;
}