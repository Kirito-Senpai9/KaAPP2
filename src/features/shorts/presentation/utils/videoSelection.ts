import type { VideoPlayer, VideoSource } from 'expo-video';

export const MAX_SHORT_DURATION_MS = 60_000;
export const VIDEO_METADATA_TIMEOUT_MS = 15_000;

export function classifyShortDuration(durationMs: number | null | undefined) {
  if (durationMs == null || !Number.isFinite(durationMs) || durationMs <= 0) return 'unknown';
  return durationMs <= MAX_SHORT_DURATION_MS ? 'valid' : 'too-long';
}

function sourceUri(source: VideoSource | null) {
  return typeof source === 'string' ? source : typeof source === 'object' ? source?.uri : undefined;
}

/** Subscribe before replacing: replaceAsync on Android does not await metadata. */
export function loadShortVideo(
  player: Pick<VideoPlayer, 'addListener' | 'replaceAsync' | 'duration'>,
  uri: string,
  signal: AbortSignal,
  timeoutMs = VIDEO_METADATA_TIMEOUT_MS,
): Promise<number> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('Seleção cancelada.'));
      return;
    }
    let finished = false;
    let currentSourceMatches = false;
    const subscriptions: Array<{ remove(): void }> = [];
    const cleanup = () => {
      clearTimeout(timer);
      subscriptions.forEach((subscription) => subscription.remove());
      signal.removeEventListener('abort', onAbort);
    };
    const fail = (error: Error) => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(error);
    };
    const acceptDuration = (seconds: number) => {
      const durationMs = seconds * 1000;
      const result = classifyShortDuration(durationMs);
      if (finished || result === 'unknown') return;
      if (result === 'too-long') {
        fail(new Error('Escolha um vídeo com até 60 segundos.'));
        return;
      }
      finished = true;
      cleanup();
      resolve(durationMs);
    };
    const onAbort = () => fail(new Error('Seleção cancelada.'));
    const timer = setTimeout(() => fail(new Error('Não foi possível confirmar a duração. Escolha outro vídeo.')), timeoutMs);
    signal.addEventListener('abort', onAbort, { once: true });
    subscriptions.push(
      player.addListener('sourceChange', ({ source }) => {
        currentSourceMatches = sourceUri(source) === uri;
      }),
      player.addListener('sourceLoad', ({ videoSource, duration }) => {
        if (sourceUri(videoSource) !== uri) return;
        currentSourceMatches = true;
        acceptDuration(duration);
      }),
      player.addListener('statusChange', ({ status }) => {
        if (status === 'error') fail(new Error('Não foi possível abrir esse vídeo. Escolha outro arquivo.'));
        if (status === 'readyToPlay' && currentSourceMatches) acceptDuration(player.duration);
      }),
    );
    try {
      void player.replaceAsync({ uri, useCaching: /^https?:\/\//i.test(uri) }).catch(() => {
        fail(new Error('Não foi possível abrir esse vídeo. Escolha outro arquivo.'));
      });
    } catch {
      fail(new Error('Não foi possível abrir esse vídeo. Escolha outro arquivo.'));
    }
  });
}
