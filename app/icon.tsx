import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#F97316',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '50%',
          position: 'relative',
        }}
      >
        {/* Basketball icon - simplified */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" fill="none" />
          <path
            d="M12 2 C12 2, 8 6, 8 12 C8 18, 12 22, 12 22"
            stroke="white"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M12 2 C12 2, 16 6, 16 12 C16 18, 12 22, 12 22"
            stroke="white"
            strokeWidth="1.5"
            fill="none"
          />
          <ellipse cx="12" cy="12" rx="10" ry="4" stroke="white" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
