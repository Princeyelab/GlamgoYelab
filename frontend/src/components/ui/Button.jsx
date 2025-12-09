import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Modern Button component with Tailwind CSS
 * Conforms to GlamGo Design System App-Like requirements:
 * - Pill shape (border-radius: 9999px)
 * - Minimum height: 56px (touch-friendly)
 * - Benefit-oriented actions
 * - Smooth animations and micro-interactions
 *
 * @component
 * @example
 * <Button variant="primary" size="md">Commencer maintenant</Button>
 * <Button variant="outline" size="lg">Explorer les services</Button>
 */
const Button = forwardRef(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'font-semibold rounded-full transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-primary text-white hover:bg-primary-hover shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]',
      secondary:
        'bg-secondary text-white hover:bg-secondary-hover shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]',
      outline:
        'border-2 border-primary text-primary hover:bg-primary/10 active:scale-[0.98]',
      ghost:
        'text-primary hover:bg-primary/10 active:scale-[0.98]',
      accent:
        'bg-accent text-white hover:bg-accent-hover shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'h-10 px-4 text-sm',
      md: 'h-14 px-8 text-base',
      lg: 'h-16 px-12 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          loading && 'cursor-wait opacity-70',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
