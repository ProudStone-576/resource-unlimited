'use client';

interface HeroImg {
  src: string;
  fallback: string;
  alt: string;
}

interface Props {
  primary: HeroImg;
  secondary: HeroImg;
  tertiary: HeroImg;
}

function withFallback(img: HeroImg): React.ImgHTMLAttributes<HTMLImageElement> {
  return {
    src: img.src,
    alt: img.alt,
    onError: (e) => {
      const t = e.target as HTMLImageElement;
      if (!t.src.includes('placehold.co')) t.src = img.fallback;
    },
  };
}

/** Desktop layered image composition for the hero right panel */
export function HeroImages({ primary, secondary, tertiary }: Props) {
  return (
    <>
      {/* Tertiary — upper-right, behind */}
      <div className="absolute right-[5%] top-[7%] w-[26%]" style={{ zIndex: 10 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...withFallback(tertiary)}
          className="w-full rounded-sm"
          style={{ transform: 'rotate(6deg)', boxShadow: '0 10px 36px rgba(0,0,0,0.16)' }}
        />
      </div>

      {/* Secondary — lower-left, behind primary */}
      <div className="absolute bottom-[8%] left-[4%] w-[27%]" style={{ zIndex: 15 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...withFallback(secondary)}
          className="w-full rounded-sm"
          style={{ transform: 'rotate(-12deg)', boxShadow: '0 10px 36px rgba(0,0,0,0.14)' }}
        />
      </div>

      {/* Primary — centered, on top */}
      <div className="absolute left-[13%] top-1/2 w-[56%] -translate-y-1/2" style={{ zIndex: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...withFallback(primary)}
          className="w-full rounded-sm"
          style={{ transform: 'rotate(-2deg)', boxShadow: '0 20px 64px rgba(0,0,0,0.22)' }}
        />
      </div>
    </>
  );
}

/** Mobile: single full-width product image */
export function HeroMobileImage({ primary }: { primary: HeroImg }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...withFallback(primary)}
      className="w-full rounded-sm"
    />
  );
}
