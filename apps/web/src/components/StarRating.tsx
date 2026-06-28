// Server-safe star rating display. Fractional fill via clipped overlay.
export function StarRating({
  value,
  size = 14,
  color = '#F59E0B',
}: {
  value: number;
  size?: number;
  color?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const stars = '★★★★★';
  return (
    <span className="relative inline-block leading-none" style={{ fontSize: size }} aria-label={`${value} out of 5 stars`}>
      <span className="text-[#1A1A2E]/20" aria-hidden>{stars}</span>
      <span
        className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap"
        style={{ width: `${pct}%`, color }}
        aria-hidden
      >
        {stars}
      </span>
    </span>
  );
}
