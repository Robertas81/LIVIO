import { supabase } from './supabaseClient';

// Map Base44 sort strings like "-taken_at" to Supabase order.
// Base44 used "-field" for descending; Supabase uses { column, ascending: false }.
function parseSort(sort) {
  if (!sort) return { column: 'created_date', ascending: false };
  const desc = sort.startsWith('-');
  const column = desc ? sort.slice(1) : sort;
  return { column, ascending: !desc };
}

// Entity wrapper that mimics the Base44 SDK entity API used by the app.
// Methods: list, get, create, update, delete, filter
export const SitePhoto = {
  async list(sort, limit) {
    const { column, ascending } = parseSort(sort);
    const query = supabase.from('site_photos').select('*').order(column, { ascending });
    if (limit) query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase.from('site_photos').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase.from('site_photos').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, payload) {
    const { data, error } = await supabase.from('site_photos').update(payload).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('site_photos').delete().eq('id', id);
    if (error) throw error;
  },

  async filter(filters, sort, limit) {
    const { column, ascending } = parseSort(sort);
    let query = supabase.from('site_photos').select('*');
    if (filters && typeof filters === 'object') {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }
    }
    query = query.order(column, { ascending });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};

export const Comment = {
  async filter(filters, sort, limit) {
    const { column, ascending } = parseSort(sort);
    let query = supabase.from('comments').select('*');
    if (filters && typeof filters === 'object') {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }
    }
    query = query.order(column, { ascending });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(payload) {
    const { data, error } = await supabase.from('comments').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) throw error;
  },
};

// File upload helper — replaces base44.integrations.Core.UploadPublicFile
export async function uploadPublicFile(file) {
  const fileName = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('photos')
    .upload(fileName, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);
  return { file_url: urlData.publicUrl };
}
