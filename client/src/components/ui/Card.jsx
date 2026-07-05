import { cn } from '../../utils/cn';

export const Card = ({ className, ...props }) => (
  <section
    className={cn(
      'rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800',
      className,
    )}
    {...props}
  />
);
