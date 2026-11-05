export default function StationLogo({ station, size = 80, sizes = `${size}px`, loading = 'lazy', ...props }) {
  return <img src={station.logo} srcSet={station.logoSrcSet} sizes={sizes}
    width={size} height={size} alt='' loading={loading} decoding='async' {...props} />;
}
