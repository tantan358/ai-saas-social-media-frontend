import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  hover?: boolean
  gradient?: boolean
  style?: React.CSSProperties
}

export default function Card({ children, hover = false, gradient = false, style }: CardProps) {
  const cardStyle: React.CSSProperties = {
    background: gradient
      ? 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)'
      : 'var(--bg-primary)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-md)',
    padding: 'var(--spacing-xl)',
    transition: 'all var(--transition-slow)',
    ...style,
  }

  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-xl)'
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        }
      }}
    >
      {children}
    </div>
  )
}
