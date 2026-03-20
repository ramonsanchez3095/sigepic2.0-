import * as React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ───── Mini-calendario propio (sin react-day-picker) ───── */

function MiniCalendar({ selected, onSelect }) {
  const [viewDate, setViewDate] = React.useState(selected || new Date());

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // lunes
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Construir filas de 7 días
  const rows = [];
  let day = calStart;
  while (day <= calEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(day));
      day = addDays(day, 1);
    }
    rows.push(week);
  }

  const dayNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

  return (
    <div className="w-[280px] select-none">
      {/* Header: mes/año + flechas */}
      <div className="flex items-center justify-between px-2 py-2 bg-gradient-to-r from-blue-800 to-cyan-600 rounded-t-lg">
        <button
          type="button"
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-white/20 text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-white capitalize">
          {format(viewDate, 'MMMM yyyy', { locale: es })}
        </span>
        <button
          type="button"
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-white/20 text-white transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 px-1 pt-2 pb-1">
        {dayNames.map(d => (
          <div
            key={d}
            className="text-center text-[11px] font-semibold text-slate-500 uppercase py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="px-1 pb-2">
        {rows.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((d, di) => {
              const inMonth = isSameMonth(d, viewDate);
              const isSelected = selected && isSameDay(d, selected);
              const today = isToday(d);

              return (
                <button
                  key={di}
                  type="button"
                  onClick={() => onSelect(d)}
                  className={cn(
                    'h-8 w-full text-sm rounded-md transition-colors',
                    'hover:bg-blue-100 dark:hover:bg-blue-900/40',
                    !inMonth && 'text-slate-300 dark:text-slate-600',
                    inMonth && 'text-slate-700 dark:text-slate-200',
                    today &&
                      !isSelected &&
                      'bg-blue-50 font-bold text-blue-600 ring-1 ring-blue-400',
                    isSelected &&
                      'bg-blue-700 text-white font-bold hover:bg-blue-800'
                  )}
                >
                  {format(d, 'd')}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── DatePicker con dropdown ───── */

export function DatePicker({
  date,
  onSelect,
  placeholder = 'Seleccionar fecha',
  disabled,
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);

  // Cerrar al hacer clic fuera
  React.useEffect(() => {
    if (!open) return;
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Cerrar con Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSelect = d => {
    onSelect(d);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-left',
          'hover:bg-accent hover:text-accent-foreground transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed',
          !date && 'text-muted-foreground'
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="truncate">
          {date ? format(date, 'dd/MM/yyyy') : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 rounded-lg border border-slate-200 bg-white shadow-xl dark:bg-slate-900 dark:border-slate-700">
          <MiniCalendar selected={date} onSelect={handleSelect} />
        </div>
      )}
    </div>
  );
}
