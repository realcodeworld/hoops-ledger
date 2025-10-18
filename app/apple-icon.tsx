import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: '#F97316',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '20%',
          position: 'relative',
        }}
      >
        {/* Basketball icon - larger for apple touch */}
        <svg
          width="140"
          height="140"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.2" fill="none" />
          <path
            d="M12 2 C12 2, 8 6, 8 12 C8 18, 12 22, 12 22"
            stroke="white"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M12 2 C12 2, 16 6, 16 12 C16 18, 12 22, 12 22"
            stroke="white"
            strokeWidth="1.2"
            fill="none"
          />
          <ellipse cx="12" cy="12" rx="10" ry="4" stroke="white" strokeWidth="1.2" fill="none" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
