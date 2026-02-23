import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, style, ...props }, ref) => {
    return (
      <div style={{ width: '100%' }}>
        {label && (
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginBottom: '0.375rem',
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          {icon && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                paddingLeft: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                color: 'var(--gray-400)',
              }}
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            style={{
              width: '100%',
              padding: '0.625rem 1rem',
              paddingLeft: icon ? '2.5rem' : '1rem',
              border: `1px solid ${error ? 'var(--error)' : 'var(--gray-300)'}`,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              transition: 'all var(--transition-base)',
              outline: 'none',
              ...style,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error ? 'var(--error)' : 'var(--primary)'
              e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)'}`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? 'var(--error)' : 'var(--gray-300)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            {...props}
          />
        </div>
        {error && (
          <p
            style={{
              marginTop: '0.375rem',
              fontSize: '0.875rem',
              color: 'var(--error)',
              animation: 'fadeIn var(--transition-base) ease-out',
            }}
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
