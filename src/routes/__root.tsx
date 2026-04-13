import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: RootComponent,
})

function GeometricBackground() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Large blurred circles — soft colour washes in corners */}
      <circle
        cx="100%"
        cy="0"
        r="220"
        style={{ fill: 'var(--color-accent)', opacity: 0.13, filter: 'blur(55px)' }}
      />
      <circle
        cx="0"
        cy="100%"
        r="180"
        style={{ fill: 'var(--color-primary)', opacity: 0.10, filter: 'blur(45px)' }}
      />
      <circle
        cx="55%"
        cy="85%"
        r="130"
        style={{ fill: 'var(--color-mid)', opacity: 0.07, filter: 'blur(35px)' }}
      />

      {/* Medium ring circles — sharp outlines */}
      <circle
        cx="18%"
        cy="28%"
        r="88"
        fill="none"
        style={{ stroke: 'var(--color-mid)', strokeWidth: 1, opacity: 0.15 }}
      />
      <circle
        cx="78%"
        cy="58%"
        r="112"
        fill="none"
        style={{ stroke: 'var(--color-accent)', strokeWidth: 0.75, opacity: 0.12 }}
      />
      <circle
        cx="42%"
        cy="12%"
        r="58"
        fill="none"
        style={{ stroke: 'var(--color-primary)', strokeWidth: 0.75, opacity: 0.10 }}
      />
      <circle
        cx="88%"
        cy="22%"
        r="42"
        fill="none"
        style={{ stroke: 'var(--color-mid)', strokeWidth: 1, opacity: 0.12 }}
      />

      {/* Small filled circles — decorative dots */}
      <circle cx="68%" cy="20%" r="6" style={{ fill: 'var(--color-accent)', opacity: 0.18 }} />
      <circle cx="30%" cy="70%" r="5" style={{ fill: 'var(--color-mid)', opacity: 0.15 }} />
      <circle cx="82%" cy="78%" r="4" style={{ fill: 'var(--color-primary)', opacity: 0.14 }} />
      <circle cx="12%" cy="55%" r="7" style={{ fill: 'var(--color-accent)', opacity: 0.12 }} />
      <circle cx="55%" cy="45%" r="3" style={{ fill: 'var(--color-mid)', opacity: 0.13 }} />

      {/* Small diamonds — rotated squares */}
      <rect
        width="14" height="14"
        style={{ fill: 'var(--color-accent)', opacity: 0.15 }}
        transform="translate(58, 130) rotate(45 7 7)"
      />
      <rect
        width="10" height="10"
        style={{ fill: 'var(--color-mid)', opacity: 0.13 }}
        transform="translate(310, 420) rotate(45 5 5)"
      />
      <rect
        width="18" height="18"
        style={{ fill: 'var(--color-primary)', opacity: 0.10 }}
        transform="translate(88, 78) rotate(45 9 9)"
      />
    </svg>
  )
}

function RootComponent() {
  return (
    <>
      <GeometricBackground />
      <div style={{ position: 'relative', zIndex: 1 }} className="min-h-screen">
        <Outlet />
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  )
}
