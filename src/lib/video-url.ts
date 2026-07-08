const YOUTUBE_EMBED =
  /^https:\/\/(www\.)?youtube\.com\/embed\/[\w-]+(\?[\w&=%.-]*)?$/i;
const VIMEO_EMBED =
  /^https:\/\/player\.vimeo\.com\/video\/\d+(\?[\w&=%.-]*)?$/i;
const VIDEO_FILE = /^https?:\/\/[^\s]+\.(mp4|webm|ogg)(\?[^\s]*)?$/i;
const LOCAL_UPLOAD = /^\/uploads\/[\w./-]+\.(mp4|webm|ogg)$/i;

/**
 * Convertit une URL vidéo utilisateur en URL d'embed sûre, ou null si invalide.
 */
export function toSafeVideoEmbedUrl(url: string): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  if (YOUTUBE_EMBED.test(trimmed) || VIMEO_EMBED.test(trimmed)) {
    return trimmed;
  }

  if (VIDEO_FILE.test(trimmed) || LOCAL_UPLOAD.test(trimmed)) {
    return trimmed;
  }

  const ytWatch = trimmed.match(
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?.*v=([\w-]+)/i,
  );
  if (ytWatch?.[1]) {
    return `https://www.youtube.com/embed/${ytWatch[1]}?autoplay=0&rel=0`;
  }

  const ytShort = trimmed.match(/^https?:\/\/youtu\.be\/([\w-]+)/i);
  if (ytShort?.[1]) {
    return `https://www.youtube.com/embed/${ytShort[1]}?autoplay=0&rel=0`;
  }

  const vimeo = trimmed.match(/^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i);
  if (vimeo?.[1]) {
    return `https://player.vimeo.com/video/${vimeo[1]}`;
  }

  return null;
}

/**
 * Retourne une miniature d'aperçu pour une URL vidéo YouTube, ou null si non dérivable
 * (Vimeo nécessite un appel API ; les fichiers MP4/WebM n'ont pas de miniature auto).
 * Sert de couverture par défaut pour les articles vidéo sans image uploadée.
 */
export function getVideoThumbnailUrl(url: string): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  const patterns = [
    /youtube\.com\/watch\?[^\s]*\bv=([\w-]{11})/i,
    /youtu\.be\/([\w-]{11})/i,
    /youtube\.com\/embed\/([\w-]{11})/i,
  ];
  for (const re of patterns) {
    const match = trimmed.match(re);
    if (match?.[1]) {
      return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
    }
  }
  return null;
}

export function isSafeVideoFileUrl(url: string): boolean {
  const safe = toSafeVideoEmbedUrl(url);
  if (!safe) return false;
  return (
    VIDEO_FILE.test(safe) ||
    LOCAL_UPLOAD.test(safe) ||
    /\.(mp4|webm|ogg)(\?|$)/i.test(safe)
  );
}
