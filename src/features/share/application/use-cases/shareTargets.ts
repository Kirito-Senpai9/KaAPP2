import type { ShareTarget } from '@/features/share/domain/entities/share';

export function filterShareTargets(
  targets: ShareTarget[],
  query: string
): ShareTarget[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return targets;
  }

  return targets.filter((target) => {
    const normalizedName = target.name.toLowerCase();
    const normalizedSubtitle = target.subtitle?.toLowerCase() ?? '';
    return (
      normalizedName.includes(normalizedQuery) ||
      normalizedSubtitle.includes(normalizedQuery)
    );
  });
}

export function buildShareTargetList(
  targets: ShareTarget[],
  query: string,
  recentIds: string[]
): ShareTarget[] {
  const filtered = filterShareTargets(targets, query);

  if (recentIds.length === 0) {
    return filtered;
  }

  const filteredById = new Map(filtered.map((target) => [target.id, target]));
  const recentTargets: ShareTarget[] = [];
  const seenRecentIds = new Set<string>();

  for (const id of recentIds) {
    const target = filteredById.get(id);
    if (target && !seenRecentIds.has(id)) {
      recentTargets.push(target);
      seenRecentIds.add(id);
    }
  }

  const remaining = filtered.filter((target) => !seenRecentIds.has(target.id));

  return [...recentTargets, ...remaining];
}
