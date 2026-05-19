/**
 * storage.js — Supabase Storage helpers for LAURA AI
 *
 * Usage:
 *   import { uploadFile, getPublicUrl, deleteFile } from './storage';
 *
 * Bucket conventions:
 *   resources/   → annales, fiches, livres, épreuves (public read)
 *   contributions/ → fichiers soumis par tuteurs contributeurs (public read after validation)
 */

import { supabase } from '../supabase';

const BUCKET_RESOURCES     = 'resources';
const BUCKET_CONTRIBUTIONS = 'contributions';

/* ── helpers ──────────────────────────────────────────────────────────────── */

function sanitizeFileName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove accents
    .replace(/[^a-zA-Z0-9._-]/g, '_') // replace special chars
    .toLowerCase();
}

function buildPath(folder, file) {
  const ts   = Date.now();
  const safe = sanitizeFileName(file.name);
  return `${folder}/${ts}_${safe}`;
}

/* ── uploadFile ───────────────────────────────────────────────────────────── */

/**
 * Upload a file to Supabase Storage.
 *
 * @param {File}   file        - Browser File object
 * @param {string} bucket      - 'resources' | 'contributions'
 * @param {string} [folder]    - sub-folder inside the bucket (e.g. 'annales')
 * @returns {Promise<{ path: string, url: string }>}
 */
export async function uploadFile(file, bucket = BUCKET_RESOURCES, folder = '') {
  const path = buildPath(folder || bucket, file);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const url = getPublicUrl(data.path, bucket);
  return { path: data.path, url };
}

/* ── getPublicUrl ─────────────────────────────────────────────────────────── */

/**
 * Get the public CDN URL for a stored file.
 *
 * @param {string} path   - storage path returned by uploadFile
 * @param {string} bucket
 * @returns {string}
 */
export function getPublicUrl(path, bucket = BUCKET_RESOURCES) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/* ── deleteFile ───────────────────────────────────────────────────────────── */

/**
 * Delete a file from Supabase Storage.
 *
 * @param {string} path
 * @param {string} bucket
 */
export async function deleteFile(path, bucket = BUCKET_RESOURCES) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/* ── uploadContribution ───────────────────────────────────────────────────── */

/**
 * Dedicated helper for tutor contribution uploads.
 * Returns the { path, url } to store in Firestore alongside the contribution metadata.
 *
 * @param {File}   file
 * @param {string} userId   - Firestore user ID (for folder scoping)
 */
export async function uploadContribution(file, userId) {
  return uploadFile(file, BUCKET_CONTRIBUTIONS, userId);
}

/* ── uploadResource ───────────────────────────────────────────────────────── */

/**
 * Dedicated helper for admin resource uploads.
 */
export async function uploadResource(file, type = 'general') {
  return uploadFile(file, BUCKET_RESOURCES, type.toLowerCase());
}
