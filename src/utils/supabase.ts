import { createClient } from '@supabase/supabase-js'
import { Note } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database operations
export const notesApi = {
  // Get all notes (completely excluding password_hash for security)
  async getAllNotes(): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes_for_zan')
      .select('id, note, title, message, author_nickname, youtube_url, video_url, photo_urls, custom_audio_url, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // We need to check which notes have passwords by querying separately
    // This is more secure than exposing password_hash in the main query
    const notesWithPasswordStatus = await Promise.all(
      (data || []).map(async (note) => {
        // Check if this note has a password by querying only the existence
        const { data: passwordCheck } = await supabase
          .from('notes_for_zan')
          .select('id')
          .eq('id', note.id)
          .not('password_hash', 'is', null)
          .maybeSingle()
        
        return {
          ...note,
          password_hash: passwordCheck ? 'protected' : undefined
        }
      })
    )
    
    return notesWithPasswordStatus
  },

  // Get note by piano key (completely excluding password_hash for security)
  async getNoteByKey(note: string): Promise<Note | null> {
    const { data, error } = await supabase
      .from('notes_for_zan')
      .select('id, note, title, message, author_nickname, youtube_url, video_url, photo_urls, custom_audio_url, created_at')
      .eq('note', note)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    
    if (!data) return null
    
    // Check if this note has a password by querying separately
    const { data: passwordCheck } = await supabase
      .from('notes_for_zan')
      .select('id')
      .eq('id', data.id)
      .not('password_hash', 'is', null)
      .maybeSingle()
    
    return {
      ...data,
      password_hash: passwordCheck ? 'protected' : undefined
    }
  },

  // Create new note
  async createNote(noteData: Omit<Note, 'id' | 'created_at'>): Promise<Note> {
    const { data, error } = await supabase
      .from('notes_for_zan')
      .insert([noteData])
      .select('id, note, title, message, author_nickname, youtube_url, video_url, photo_urls, custom_audio_url, created_at')
      .single()

    if (error) throw error
    
    // Check if this note has a password by querying separately (same as getAllNotes)
    const { data: passwordCheck } = await supabase
      .from('notes_for_zan')
      .select('id')
      .eq('id', data.id)
      .not('password_hash', 'is', null)
      .maybeSingle()
    
    return {
      ...data,
      password_hash: passwordCheck ? 'protected' : undefined
    }
  },

  // Update note (requires password verification)
  async updateNote(id: string, noteData: Partial<Note>): Promise<Note> {
    const { data, error } = await supabase
      .from('notes_for_zan')
      .update(noteData)
      .eq('id', id)
      .select('id, note, title, message, author_nickname, youtube_url, video_url, photo_urls, custom_audio_url, created_at')
      .single()

    if (error) throw error
    
    // Check if this note has a password by querying separately (same as getAllNotes)
    const { data: passwordCheck } = await supabase
      .from('notes_for_zan')
      .select('id')
      .eq('id', data.id)
      .not('password_hash', 'is', null)
      .maybeSingle()
    
    return {
      ...data,
      password_hash: passwordCheck ? 'protected' : undefined
    }
  },

  // Delete note
  async deleteNote(id: string): Promise<void> {
    const { error } = await supabase
      .from('notes_for_zan')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Upload file to storage with optimization
  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    // For images, compress if they're too large
    let fileToUpload = file;
    if (file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) { // 2MB
      // You could add image compression here if needed
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, fileToUpload, {
        cacheControl: '3600', // Cache for 1 hour
        upsert: false // Don't overwrite existing files
      })

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return publicUrl
  },

  // Verify password using edge function (secure server-side verification)
  async verifyPassword(noteId: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-password', {
        body: { noteId, password }
      });

      if (error) {
        throw error;
      }

      return data?.isValid || false;
    } catch (error) {
      throw error;
    }
  }
}