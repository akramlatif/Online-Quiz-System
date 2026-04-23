import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, fullWidth, id, ...props }, ref) => {
    const defaultId = React.useId();
    const inputId = id || defaultId;

    const wrapperClasses = [
      styles.wrapper,
      fullWidth ? styles['full-width'] : '',
      className,
    ].filter(Boolean).join(' ');

    const inputClasses = [
      styles.input,
      error ? styles['input-error'] : '',
    ].filter(Boolean).join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={inputClasses}
          {...props}
        />
        {error && <span className={styles.error}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
