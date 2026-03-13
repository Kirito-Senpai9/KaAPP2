import { useMemo, useState } from 'react';
import { FOR_YOU, FOLLOWING } from '@/features/shorts/services/shortsService';

export function useShorts() {
  const [mode, setMode] = useState<'forYou' | 'following'>('forYou');
  const data = useMemo(() => (mode === 'forYou' ? FOR_YOU : FOLLOWING), [mode]);
  return { mode, setMode, data };
}
