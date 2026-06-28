import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

const baseField =
  'block w-full rounded-md border border-steel-200 bg-white px-3 py-2 text-sm text-steel-900 ' +
  'placeholder-steel-400 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ' +
  'disabled:cursor-not-allowed disabled:bg-steel-50';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-steel-800">
          {label}
          {props.required ? <span className="ml-0.5 text-accent-600">*</span> : null}
        </label>
      ) : null}
      <input id={inputId} className={cn(baseField, error && 'border-red-500 focus:ring-red-500/30', className)} {...props} />
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-steel-500">{hint}</p>
      ) : null}
    </div>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, className, id, ...props }: TextareaProps) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-steel-800">
          {label}
          {props.required ? <span className="ml-0.5 text-accent-600">*</span> : null}
        </label>
      ) : null}
      <textarea
        id={inputId}
        className={cn(baseField, 'min-h-[120px]', error && 'border-red-500 focus:ring-red-500/30', className)}
        {...props}
      />
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-steel-500">{hint}</p>
      ) : null}
    </div>
  );
}
