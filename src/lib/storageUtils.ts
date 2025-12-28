import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a signed URL for accessing files in private buckets
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns The signed URL or null if generation fails
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!path) return null;
  
  // If it's already a full URL (from old data), extract the path
  const cleanPath = extractPathFromUrl(path, bucket);
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(cleanPath, expiresIn);
    
  if (error) {
    console.error('[Storage] Failed to create signed URL:', error);
    return null;
  }
  
  return data.signedUrl;
}

/**
 * Extract file path from a full Supabase storage URL or return the path as-is
 * This handles backward compatibility with URLs stored before bucket was made private
 */
function extractPathFromUrl(urlOrPath: string, bucket: string): string {
  // If it's not a URL, return as-is
  if (!urlOrPath.startsWith('http')) {
    return urlOrPath;
  }
  
  try {
    const url = new URL(urlOrPath);
    // Supabase storage URLs typically have format: 
    // https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
    const pathParts = url.pathname.split(`/${bucket}/`);
    if (pathParts.length > 1) {
      return pathParts[1];
    }
    // Fallback: try to get the last segment
    const segments = url.pathname.split('/');
    return segments[segments.length - 1];
  } catch {
    return urlOrPath;
  }
}

/**
 * Hook-friendly signed URL cache to prevent excessive regeneration
 */
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export async function getCachedSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!path) return null;
  
  const cacheKey = `${bucket}:${path}`;
  const cached = signedUrlCache.get(cacheKey);
  
  // Return cached URL if it's still valid (with 5 minute buffer)
  if (cached && cached.expiresAt > Date.now() + 300000) {
    return cached.url;
  }
  
  const signedUrl = await getSignedUrl(bucket, path, expiresIn);
  
  if (signedUrl) {
    signedUrlCache.set(cacheKey, {
      url: signedUrl,
      expiresAt: Date.now() + (expiresIn * 1000)
    });
  }
  
  return signedUrl;
}
