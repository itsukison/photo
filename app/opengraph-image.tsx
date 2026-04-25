import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '@ Studio ON — Tokyo cinematic photoshoot studio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#fcfcfc',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          color: '#000',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 22,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: '#787774',
          }}
        >
          @ Studio ON · Tokyo
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 110,
              lineHeight: 1,
              fontWeight: 500,
              letterSpacing: -3,
              color: '#000',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>Cinematic Tokyo</span>
            <span>Photoshoots.</span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#37352f',
              maxWidth: 900,
              lineHeight: 1.35,
              display: 'flex',
            }}
          >
            Editorial portrait sessions at Shibuya, Shinjuku, Harajuku &amp; Akihabara.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 22,
            color: '#787774',
            borderTop: '1px solid rgba(0,0,0,0.12)',
            paddingTop: 24,
          }}
        >
          <span>studio-on.org</span>
          <span style={{ color: '#000', fontWeight: 500 }}>From $150 · 60 edited photos</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
