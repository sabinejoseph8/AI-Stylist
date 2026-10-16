/** Format/size guard only. The browser normalizer must rasterize fresh pixels
 * before returning these blobs; this helper does not authenticate provenance.
 * PNG is the native canvas fallback when WebP encoding is unavailable. */
export const NORMALIZED_PREVIEW_TYPES=Object.freeze(['image/webp','image/png'] as const);
export function isNormalizedPreviewPhoto(blob:unknown):blob is Blob{return blob instanceof Blob&&(NORMALIZED_PREVIEW_TYPES as readonly string[]).includes(blob.type)&&blob.size>0&&blob.size<=8*1024*1024;}
