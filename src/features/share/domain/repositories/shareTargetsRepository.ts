import type { ShareTarget } from '@/features/share/domain/entities/share';

export type ShareTargetsRepository = {
  getShareTargets: () => ShareTarget[];
};
