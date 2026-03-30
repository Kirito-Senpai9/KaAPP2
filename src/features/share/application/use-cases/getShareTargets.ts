import type { ShareTarget } from '@/features/share/domain/entities/share';
import type { ShareTargetsRepository } from '@/features/share/domain/repositories/shareTargetsRepository';

export function getShareTargets(
  repository: ShareTargetsRepository
): ShareTarget[] {
  return repository.getShareTargets();
}
