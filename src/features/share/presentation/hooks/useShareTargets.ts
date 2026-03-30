import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getShareTargets } from '@/features/share/application/use-cases/getShareTargets';
import { getShareTargetsRepository } from '@/features/share/infrastructure/repositories/mockShareTargetsRepository';

export function useShareTargets(subscribed = true) {
  const repository = useMemo(() => getShareTargetsRepository(), []);
  const { data = [] } = useQuery({
    queryKey: ['share-targets'],
    queryFn: () => Promise.resolve(getShareTargets(repository)),
    staleTime: Infinity,
    gcTime: Infinity,
    subscribed,
  });

  return useMemo(() => ({ targets: data }), [data]);
}
