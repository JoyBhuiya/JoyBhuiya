import { Link } from 'react-router-dom';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-motorway text-on-motorway hover:bg-motorway-hi border-transparent',
  secondary: 'bg-surface text-ink border-line-strong hover:bg-surface-2',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-surface-2',
  danger: 'bg-stop text-on-stop border-transparent hover:opacity-90',
};

const SIZES: Record<Size, string> = {
  // 44px minimum height throughout — these are thumb targets on a phone.
  sm: 'min-h-11 px-3.5 text-sm gap-1.5',
  md: 'min-h-11 px-5 text-[0.95rem] gap-2',
  lg: 'min-h-13 px-7 text-base gap-2.5',
};

const BASE =
  'inline-flex items-center justify-center rounded-[--radius] border font-medium ' +
  'transition-colors duration-150 disabled:opacity-45 disabled:pointer-events-none ' +
  'select-none text-center';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps & ComponentPropsWithoutRef<'button'>;

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {children}
    </button>
  );
}

type LinkButtonProps = CommonProps & { to: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    'to' | 'className' | 'children'
  >;

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  to,
  ...rest
}: LinkButtonProps) {
  return (
    <Link to={to} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {children}
    </Link>
  );
}
