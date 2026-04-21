import type { ProfileMedia, ProfileMediaKind, ProfileMediaTransform } from '@/features/profile/presentation/store/useProfileStore';

export const PROFILE_MEDIA_MIN_ZOOM = 1;
export const PROFILE_MEDIA_MAX_ZOOM = 4;

type PickedImageAsset = {
  uri: string;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  fileName?: string | null;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const isGifAsset = (asset: PickedImageAsset) => {
  const mimeType = asset.mimeType?.toLowerCase() ?? '';
  const fileName = asset.fileName?.toLowerCase() ?? '';
  const uri = asset.uri.toLowerCase();

  return mimeType.includes('gif') || fileName.endsWith('.gif') || /\.gif($|[?#])/i.test(uri);
};

export const getProfileMediaKindFromAsset = (asset: PickedImageAsset): ProfileMediaKind => (
  isGifAsset(asset) ? 'gif' : 'image'
);

export const createProfileMediaSource = (media: ProfileMedia) => (
  media.kind === 'gif'
    ? { uri: media.uri, isAnimated: true as const }
    : { uri: media.uri }
);

export const getProfileMediaMetrics = (
  media: Pick<ProfileMedia, 'width' | 'height'>,
  viewportWidth: number,
  viewportHeight: number,
  zoom = PROFILE_MEDIA_MIN_ZOOM
) => {
  const safeWidth = Math.max(media.width, 1);
  const safeHeight = Math.max(media.height, 1);
  const safeViewportWidth = Math.max(viewportWidth, 1);
  const safeViewportHeight = Math.max(viewportHeight, 1);
  const normalizedZoom = clamp(zoom, PROFILE_MEDIA_MIN_ZOOM, PROFILE_MEDIA_MAX_ZOOM);
  const fitScale = Math.max(safeViewportWidth / safeWidth, safeViewportHeight / safeHeight);
  const baseWidth = safeWidth * fitScale;
  const baseHeight = safeHeight * fitScale;
  const displayWidth = baseWidth * normalizedZoom;
  const displayHeight = baseHeight * normalizedZoom;
  const maxOffsetX = Math.max(0, (displayWidth - safeViewportWidth) / 2);
  const maxOffsetY = Math.max(0, (displayHeight - safeViewportHeight) / 2);

  return {
    zoom: normalizedZoom,
    baseWidth,
    baseHeight,
    displayWidth,
    displayHeight,
    maxOffsetX,
    maxOffsetY,
  };
};

export const clampProfileMediaTransform = (
  media: Pick<ProfileMedia, 'width' | 'height'>,
  viewportWidth: number,
  viewportHeight: number,
  transform: ProfileMediaTransform
): ProfileMediaTransform => {
  const metrics = getProfileMediaMetrics(media, viewportWidth, viewportHeight, transform.zoom);

  return {
    zoom: metrics.zoom,
    offsetXRatio: metrics.maxOffsetX > 0 ? clamp(transform.offsetXRatio, -1, 1) : 0,
    offsetYRatio: metrics.maxOffsetY > 0 ? clamp(transform.offsetYRatio, -1, 1) : 0,
  };
};

export const getResolvedProfileMediaTransform = (
  media: ProfileMedia,
  viewportWidth: number,
  viewportHeight: number
) => {
  const transform = clampProfileMediaTransform(media, viewportWidth, viewportHeight, media.transform);
  const metrics = getProfileMediaMetrics(media, viewportWidth, viewportHeight, transform.zoom);

  return {
    ...metrics,
    translateX: metrics.maxOffsetX > 0 ? metrics.maxOffsetX * transform.offsetXRatio : 0,
    translateY: metrics.maxOffsetY > 0 ? metrics.maxOffsetY * transform.offsetYRatio : 0,
  };
};

export const createTransformFromOffsets = (
  media: Pick<ProfileMedia, 'width' | 'height'>,
  viewportWidth: number,
  viewportHeight: number,
  zoom: number,
  translateX: number,
  translateY: number
): ProfileMediaTransform => {
  const metrics = getProfileMediaMetrics(media, viewportWidth, viewportHeight, zoom);
  const clampedX = clamp(translateX, -metrics.maxOffsetX, metrics.maxOffsetX);
  const clampedY = clamp(translateY, -metrics.maxOffsetY, metrics.maxOffsetY);

  return {
    zoom: metrics.zoom,
    offsetXRatio: metrics.maxOffsetX > 0 ? clampedX / metrics.maxOffsetX : 0,
    offsetYRatio: metrics.maxOffsetY > 0 ? clampedY / metrics.maxOffsetY : 0,
  };
};

