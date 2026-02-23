import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    fontFamily: 'inherit',
    fontWeight: 500,
    borderRadius: 'var(--radius-lg)',
    transition: 'all var(--transition-base)',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    border: 'none',
    outline: 'none',
    opacity: disabled || isLoading ? 0.6 : 1,
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--gradient-primary)',
      color: 'var(--text-inverse)',
      boxShadow: 'var(--shadow-md)',
    },
    secondary: {
      background: 'var(--gradient-secondary)',
      color: 'var(--text-inverse)',
      boxShadow: 'var(--shadow-md)',
    },
    outline: {
      border: '2px solid var(--primary)',
      color: 'var(--primary)',
      background: 'transparent',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-primary)',
    },
    danger: {
      background: 'var(--error)',
      color: 'var(--text-inverse)',
      boxShadow: 'var(--shadow-md)',
    },
  }

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
    md: { padding: '0.625rem 1.25rem', fontSize: '1rem' },
    lg: { padding: '0.875rem 1.75rem', fontSize: '1.125rem' },
  }

  const buttonStyle: React.CSSProperties = {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size],
    ...style,
  }

  return (
    <button
      style={buttonStyle}
      disabled={disabled || isLoading}
      onMouseEnter={(e) => {
        if (!disabled && !isLoading && variant !== 'ghost') {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = variants[variant]?.boxShadow || 'none'
        }
      }}
      {...props}
    >
      {isLoading && (
        <svg
          style={{
            width: '1rem',
            height: '1rem',
            animation: 'spin 1s linear infinite',
          }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            style={{ opacity: 0.25 }}
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            style={{ opacity: 0.75 }}
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  )
}
