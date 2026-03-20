import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-0', className)}
      classNames={{
        months: 'flex flex-col space-y-4',
        month: 'space-y-2 w-full',
        caption:
          'flex justify-center pt-4 pb-4 relative items-center bg-gradient-to-r from-police-navy to-police-cyan rounded-t-xl',
        caption_label: 'text-base font-bold text-white capitalize',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          'h-8 w-8 bg-white/20 hover:bg-white/30 text-white border-0 p-0 opacity-90 hover:opacity-100 transition-all rounded-lg backdrop-blur-sm flex items-center justify-center'
        ),
        nav_button_previous: 'absolute left-3',
        nav_button_next: 'absolute right-3',
        table: 'w-full border-collapse px-3 pb-3',
        head_row: 'grid grid-cols-7 w-full mb-1',
        head_cell:
          'text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase text-center py-2',
        row: 'grid grid-cols-7 w-full mt-0.5',
        cell: 'text-center text-sm p-0.5 relative focus-within:relative focus-within:z-20',
        day: cn(
          'h-9 w-full p-0 font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 transition-all rounded-lg aria-selected:opacity-100 mx-auto flex items-center justify-center'
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-gradient-to-br from-police-navy to-police-cyan !text-white hover:from-police-navy hover:to-police-cyan font-bold shadow-md',
        day_today:
          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold ring-2 ring-blue-400 ring-offset-1',
        day_outside:
          'day-outside text-slate-300 dark:text-slate-600 opacity-50 aria-selected:opacity-30',
        day_disabled:
          'text-slate-300 dark:text-slate-600 opacity-30 cursor-not-allowed hover:bg-transparent',
        day_range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
