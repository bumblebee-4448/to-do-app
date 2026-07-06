import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'react-day-picker/src/style.css';

type DatePickerProps = {
  value?: string | null;
  onChange: (date: string | null) => void;
  placeholder?: string;
};

export const DatePicker = ({ value, onChange, placeholder = 'Chọn ngày' }: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; position: 'above' | 'below' } | null>(null);

  const parsedValue = value ? new Date(value) : null;
  const selectedDate = parsedValue && !Number.isNaN(parsedValue.getTime()) ? parsedValue : undefined;

  // Handle click outside to close the picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverHeight = 350; // estimated calendar popover height
      const popoverWidth = 320;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const position = spaceBelow < popoverHeight && spaceAbove > spaceBelow ? 'above' : 'below';
      const top = position === 'below' 
        ? rect.bottom + window.scrollY + 6 
        : rect.top + window.scrollY - 6;
      const maxLeft = Math.max(8, window.innerWidth - popoverWidth - 8);
      const left = Math.min(Math.max(8, rect.left + window.scrollX), maxLeft);

      setCoords({
        top,
        left,
        position,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
    };
  }, [isOpen]);

  const handleSelect = (day: Date | undefined) => {
    if (day) {
      const year = day.getFullYear();
      const month = String(day.getMonth() + 1).padStart(2, '0');
      const date = String(day.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${date}`);
    } else {
      onChange(null);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={placeholder}
        className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 shadow-sm transition duration-200 placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-700"
        style={{ cursor: 'pointer' }}
      >
        <span className={selectedDate ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500'}>
          {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : placeholder}
        </span>
        <Calendar size={16} className="text-zinc-400" />
      </button>

      {isOpen && coords && createPortal(
        <div
          ref={popoverRef}
          className="absolute z-[9999] rounded-md border border-zinc-200 bg-white p-3 shadow-md dark:border-zinc-700 dark:bg-zinc-900"
          style={{
            top: coords.top,
            left: coords.left,
            transform: coords.position === 'above' ? 'translateY(-100%)' : 'none',
            pointerEvents: 'auto',
          }}
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            locale={vi}
          />
        </div>,
        document.body
      )}
    </div>
  );
};
