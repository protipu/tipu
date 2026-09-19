import { supabase } from '../lib/supabase';
import type { Memory } from '../types/memory';

export function useChatMemory() {
  const loadMemories = async (): Promise<Memory[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('chat?section=memories', { method: 'GET' });
      if (error) throw new Error(error.message);
      return data?.memories || [];
    } catch (err) {
      console.error('Load memories error:', err);
      return [];
    }
  };

  const createMemory = async (fact: string, category: string, importance: number): Promise<Memory | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        method: 'POST',
        body: { fact, category, importance },
      });
      if (error) throw error;
      return data?.memory || null;
    } catch (err) {
      console.error('Create memory error:', err);
      return null;
    }
  };

  const updateMemory = async (memoryId: string, updates: Partial<Memory>): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('chat', {
        method: 'PUT',
        body: { memoryId, ...updates },
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Update memory error:', err);
      return false;
    }
  };

  const deleteMemory = async (memoryId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('chat', {
        method: 'DELETE',
        body: { memoryId },
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Delete memory error:', err);
      return false;
    }
  };

  const archiveMemory = async (memoryId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('chat', {
        method: 'DELETE',
        body: { memoryId, archive: true },
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Archive memory error:', err);
      return false;
    }
  };

  return { loadMemories, createMemory, updateMemory, deleteMemory, archiveMemory };
}
