import { cn } from '../../utils/cn';

const badgeStyles = {
  high: 'bg-[#FDEBEC] text-[#9F2F2D] dark:bg-[rgba(159,47,45,0.15)] dark:text-red-300',
  medium: 'bg-[#E1F3FE] text-[#1F6C9F] dark:bg-[rgba(31,108,159,0.15)] dark:text-sky-300',
  low: 'bg-[#EDF3EC] text-[#346538] dark:bg-[rgba(52,101,56,0.15)] dark:text-emerald-300',
  completed: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  pending: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
  overdue: 'bg-[#FDEBEC] text-[#9F2F2D] dark:bg-[rgba(159,47,45,0.15)] dark:text-red-300',
};

export const Badge = ({ className, tone = 'pending', children }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize leading-none',
      badgeStyles[tone] || badgeStyles.pending,
      className,
    )}
  >
    {children}
  </span>
);
