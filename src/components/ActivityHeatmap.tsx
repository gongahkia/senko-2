import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { HeatmapValue } from '@/types';
import { subDays } from 'date-fns';

interface ActivityHeatmapProps {
  data: HeatmapValue[];
  daysBack?: number;
}

export function ActivityHeatmap({ data, daysBack = 365 }: ActivityHeatmapProps) {
  const endDate = new Date();
  const startDate = subDays(endDate, daysBack);

  // Determine color intensity based on count
  const getColor = (count: number): string => {
    if (count === 0) return 'color-empty';
    if (count < 5) return 'color-scale-1';
    if (count < 10) return 'color-scale-2';
    if (count < 20) return 'color-scale-3';
    return 'color-scale-4';
  };

  return (
    <div className="activity-heatmap">
      <style>{`
        .activity-heatmap {
          font-size: 12px;
        }

        .activity-heatmap .react-calendar-heatmap {
          width: 100%;
        }

        .activity-heatmap .react-calendar-heatmap text {
          font-size: 10px;
          fill: hsl(var(--muted-foreground));
        }

        .activity-heatmap .react-calendar-heatmap .color-empty {
          fill: hsl(var(--muted));
        }

        .activity-heatmap .react-calendar-heatmap .color-scale-1 {
          fill: hsl(var(--primary) / 0.3);
        }

        .activity-heatmap .react-calendar-heatmap .color-scale-2 {
          fill: hsl(var(--primary) / 0.5);
        }

        .activity-heatmap .react-calendar-heatmap .color-scale-3 {
          fill: hsl(var(--primary) / 0.7);
        }

        .activity-heatmap .react-calendar-heatmap .color-scale-4 {
          fill: hsl(var(--primary));
        }

        .activity-heatmap .react-calendar-heatmap .react-calendar-heatmap-month-label {
          font-size: 10px;
        }

        .activity-heatmap .react-calendar-heatmap .react-calendar-heatmap-weekday-label {
          font-size: 9px;
        }

        /* Tooltip styling */
        .activity-heatmap-tooltip {
          background: hsl(var(--popover));
          border: 1px solid hsl(var(--border));
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          color: hsl(var(--popover-foreground));
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          pointer-events: none;
          position: absolute;
          z-index: 1000;
        }
      `}</style>

      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={data}
        classForValue={(value) => {
          if (!value || value.count === 0) {
            return 'color-empty';
          }
          return getColor(value.count);
        }}
        showWeekdayLabels
        gutterSize={2}
      />

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(var(--muted))' }} />
          <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(var(--primary) / 0.3)' }} />
          <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(var(--primary) / 0.5)' }} />
          <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(var(--primary) / 0.7)' }} />
          <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(var(--primary))' }} />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
