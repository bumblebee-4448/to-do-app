import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'h-5 w-5 rounded border-zinc-300 text-zinc-950 accent-zinc-950 transition duration-200 focus:ring-2 focus:ring-zinc-300 dark:border-zinc-600 dark:accent-zinc-100 dark:focus:ring-zinc-700',
        className,
      )}
      {...props}
    />
  );
});
