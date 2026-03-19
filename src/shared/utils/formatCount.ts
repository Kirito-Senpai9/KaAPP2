type SuffixStyle = 'upper' | 'lower';

const formatCompact = (
  value: number,
  divisor: number,
  suffix: 'K' | 'M',
  suffixStyle: SuffixStyle
) => {
  const short = Math.round((value / divisor) * 10) / 10;
  const display = Number.isInteger(short) ? `${short}` : `${short}`.replace('.', ',');
  return `${display}${suffixStyle === 'lower' ? suffix.toLowerCase() : suffix}`;
};

export function formatCount(value: number, suffixStyle: SuffixStyle = 'upper') {
  if (value < 1000) return `${value}`;
  if (value < 1_000_000) return formatCompact(value, 1000, 'K', suffixStyle);
  return formatCompact(value, 1_000_000, 'M', suffixStyle);
}
