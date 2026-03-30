import type {
  ShareTarget,
  ShareTargetSection,
} from '@/features/share/domain/entities/share';

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

export function buildShareTargetSections(
  targets: ShareTarget[]
): ShareTargetSection[] {
  const contacts = targets.filter((target) => target.type === 'user');
  const communities = targets.filter((target) => target.type === 'community');

  const sections: ShareTargetSection[] = [
    {
      key: 'contacts',
      title: 'Contatos',
      targets: contacts,
    },
    {
      key: 'communities',
      title: 'Comunidades',
      targets: communities,
    },
  ];

  return sections.filter((section) => section.targets.length > 0);
}
