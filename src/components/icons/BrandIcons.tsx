/**
 * Streaming service brand icons
 * These are styled div components that mimic the brand colors and styling
 */

interface BrandIconProps {
  className?: string;
}

export const NetflixIcon = ({ className }: BrandIconProps) => (
  <div className={`w-full h-full rounded-lg bg-[#E50914] flex items-center justify-center font-bold text-white text-lg ${className}`}>
    N
  </div>
);

export const YouTubeIcon = ({ className }: BrandIconProps) => (
  <div className={`w-full h-full rounded-lg bg-[#FF0000] flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
      <path d="M8 5v14l11-7z"/>
    </svg>
  </div>
);

export const PrimeVideoIcon = ({ className }: BrandIconProps) => (
  <div className={`w-full h-full rounded-lg bg-[#00A8E1] flex items-center justify-center font-bold text-white text-sm ${className}`}>
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
      <path d="M1.64 16.14c-.79.51-.54 1.78.44 1.78.27 0 .55-.09.79-.27 2.19-1.7 5.55-3.65 10.13-3.65 4.17 0 7.74 1.24 9.36 2.04.52.26 1.03-.21.81-.68-.25-.56-.8-1.24-1.42-1.67-2.53-1.74-6.55-2.69-10.75-2.69-5.34 0-8.34 2.61-9.36 5.14zM17.47 18.68c.43-.15.91.14.91.55 0 .56-.56.91-1.53.91-2.33 0-4.82-1.01-5.85-2.56-.35-.51.35-1.02.91-.62 1.32.94 3.23 1.95 5.56 1.72z"/>
    </svg>
  </div>
);

export const PlexIcon = ({ className }: BrandIconProps) => (
  <div className={`w-full h-full rounded-lg bg-[#E5A00D] flex items-center justify-center font-bold text-black text-lg ${className}`}>
    P
  </div>
);

export const DisneyPlusIcon = ({ className }: BrandIconProps) => (
  <div className={`w-full h-full rounded-lg bg-[#113CCF] flex items-center justify-center font-bold text-white text-sm ${className}`}>
    D+
  </div>
);

export const HBOMaxIcon = ({ className }: BrandIconProps) => (
  <div className={`w-full h-full rounded-lg bg-[#B014C8] flex items-center justify-center font-bold text-white text-xs ${className}`}>
    MAX
  </div>
);

export const SpotifyIcon = ({ className }: BrandIconProps) => (
  <div className={`w-full h-full rounded-lg bg-[#1DB954] flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  </div>
);

// Map of package names to brand icons
export const BRAND_ICONS: Record<string, React.FC<BrandIconProps>> = {
  'com.netflix.ninja': NetflixIcon,
  'com.google.android.youtube.tv': YouTubeIcon,
  'com.amazon.amazonvideo.livingroom': PrimeVideoIcon,
  'com.plexapp.android': PlexIcon,
  'com.disney.disneyplus': DisneyPlusIcon,
  'com.hbo.hbomax': HBOMaxIcon,
  'com.spotify.tv.android': SpotifyIcon,
};
