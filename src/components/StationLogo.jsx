export default function StationLogo({
  station,
  size = 80,
  sizes = `${size}px`,
  loading = 'lazy',
  ...props
}) {
  if (!station.logo) {
    const initials = station.name
      .replace(/^SomaFM\s*[·:]\s*/, '')
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join('');
    return (
      <svg
        data-station-logo
        viewBox="0 0 80 80"
        width={size}
        height={size}
        aria-hidden="true"
        {...props}
      >
        <rect width="80" height="80" rx="12" fill="#24324a" />
        <text
          x="40"
          y="43"
          dy=".1em"
          textAnchor="middle"
          fill="#f3f5fa"
          fontSize="28"
          fontWeight="700"
        >
          {initials}
        </text>
      </svg>
    );
  }
  return (
    <img
      data-station-logo
      src={station.logo}
      srcSet={station.logoSrcSet}
      sizes={sizes}
      width={size}
      height={size}
      alt=""
      loading={loading}
      decoding="async"
      {...props}
    />
  );
}
