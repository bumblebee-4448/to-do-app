import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

const badgeStyles = {
  pending: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  completed: 'bg-[#EDF3EC] text-[#346538] dark:bg-[rgba(52,101,56,0.15)] dark:text-emerald-300',
  incomplete: 'bg-[#E1F3FE] text-[#1F6C9F] dark:bg-[rgba(31,108,159,0.15)] dark:text-sky-300',
  overdue: 'bg-[#FDEBEC] text-[#9F2F2D] dark:bg-[rgba(159,47,45,0.15)] dark:text-red-300',
} as const;

type BadgeTone = keyof typeof badgeStyles;
type BadgeProps = {
  className?: string;
  tone?: BadgeTone;
  children: ReactNode;
};

const translateTone = (text: string) => {
  const dict: Record<string, string> = {
    pending: 'Chờ thực hiện',
    completed: 'Hoàn thành',
    incomplete: 'Chưa hoàn thành',
    overdue: 'Quá hạn',
  };
  return dict[text.toLowerCase()] || text;
};

export const Badge = ({ className, tone = 'incomplete', children }: BadgeProps) => {
  const content = typeof children === 'string' ? translateTone(children) : children;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium leading-none',
        badgeStyles[tone] || badgeStyles.incomplete,
        className,
      )}
    >
      {content}
    </span>
  );
};
