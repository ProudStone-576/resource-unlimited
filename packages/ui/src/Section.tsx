import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  eyebrow?: string;
  heading?: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
}

export function Section({
  eyebrow,
  heading,
  description,
  align = 'left',
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn('py-16 sm:py-20', className)} {...props}>
      {(eyebrow || heading || description) && (
        <div className={cn('mb-10 max-w-3xl', align === 'center' && 'mx-auto text-center')}>
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-600">
              {eyebrow}
            </p>
          ) : null}
          {heading ? (
            <h2 className="font-display text-3xl font-bold text-steel-900 sm:text-4xl">{heading}</h2>
          ) : null}
          {description ? (
            <p className="mt-3 text-base text-steel-600 sm:text-lg">{description}</p>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}
