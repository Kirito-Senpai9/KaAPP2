import type { LiveStream } from '@/features/live/domain/entities/live';

export interface LiveRepository {
  getLives(): LiveStream[];
}
