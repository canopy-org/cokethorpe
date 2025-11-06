'use client';

interface DateRangePickerProps {
  period: 'day' | 'month' | 'year';
  date: string; // ISO date string (YYYY-MM-DD, YYYY-MM, or YYYY)
  aggregation: 'hourly' | 'daily' | 'monthly';
  onPeriodChange: (period: 'day' | 'month' | 'year') => void;
  onDateChange: (date: string) => void;
  onAggregationChange: (aggregation: 'hourly' | 'daily' | 'monthly') => void;
}

export default function DateRangePicker({ 
  period, 
  date, 
  aggregation,
  onPeriodChange, 
  onDateChange,
  onAggregationChange 
}: DateRangePickerProps) {
  
  // Format date for input based on period
  const getInputValue = () => {
    try {
      if (period === 'day') {
        // Ensure YYYY-MM-DD format
        if (date.length === 10 && date.includes('-')) {
          return date; // Already in correct format
        }
        // If it's in month format (YYYY-MM), append -01
        if (date.length === 7) {
          return `${date}-01`;
        }
        // If it's just year, append -01-01
        if (date.length === 4) {
          return `${date}-01-01`;
        }
        return date;
      } else if (period === 'month') {
        // Ensure YYYY-MM format
        if (date.length === 7 && date.split('-').length === 2) {
          return date; // Already in correct format
        }
        // If it's in day format (YYYY-MM-DD), remove the day
        if (date.length === 10) {
          return date.slice(0, 7);
        }
        // If it's just year, append -01
        if (date.length === 4) {
          return `${date}-01`;
        }
        return date;
      } else {
        // Year format - just ensure it's 4 digits
        if (date.length === 10) {
          return date.slice(0, 4); // Extract year from YYYY-MM-DD
        }
        if (date.length === 7) {
          return date.slice(0, 4); // Extract year from YYYY-MM
        }
        return date; // Already YYYY
      }
    } catch (e) {
      console.error('Error formatting date:', e);
      return date;
    }
  };

  // Get the appropriate input type
  const getInputType = () => {
    if (period === 'day') return 'date';
    if (period === 'month') return 'month';
    return 'number'; // For year
  };

  // Determine which aggregation options should be disabled
  const isAggregationDisabled = (agg: 'hourly' | 'daily' | 'monthly') => {
    if (period === 'day') {
      return agg === 'daily' || agg === 'monthly';
    }
    if (period === 'month') {
      return agg === 'monthly';
    }
    return false; // Year period allows all
  };

  return (
    <>
      <style>{`
        input[type="date"]::-webkit-clear-button,
        input[type="month"]::-webkit-clear-button {
          display: none;
        }
        input[type="date"]::-webkit-inner-spin-button,
        input[type="month"]::-webkit-inner-spin-button {
          display: none;
        }
      `}</style>
      <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Period:</label>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as 'day' | 'month' | 'year')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
        >
          <option value="day">Day</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </div>

      {/* Date Selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          {period === 'day' ? 'Date:' : period === 'month' ? 'Month:' : 'Year:'}
        </label>
        {period === 'year' ? (
          <input
            type="number"
            value={date}
            onChange={(e) => {
              const val = e.target.value;
              if (val && val.length === 4) {
                onDateChange(val);
              }
            }}
            min="2020"
            max={new Date().getFullYear()}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm w-32"
          />
        ) : (
          <input
            type={getInputType()}
            value={getInputValue()}
            onChange={(e) => {
              const val = e.target.value;
              if (val) { // Only update if not empty
                onDateChange(val);
              }
            }}
            onKeyDown={(e) => {
              // Prevent delete/backspace from clearing the entire field
              if (e.key === 'Delete' || e.key === 'Backspace') {
                const input = e.currentTarget;
                if (input.value && input.selectionStart === 0 && input.selectionEnd === input.value.length) {
                  e.preventDefault();
                }
              }
            }}
            max={period === 'day' ? new Date().toISOString().split('T')[0] : 
                 period === 'month' ? new Date().toISOString().slice(0, 7) : 
                 undefined}
            required
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            style={{
              WebkitAppearance: 'none',
              MozAppearance: 'textfield'
            }}
          />
        )}
      </div>

      {/* Aggregation Selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Show as:</label>
        <div className="flex gap-2">
          <button
            onClick={() => !isAggregationDisabled('hourly') && onAggregationChange('hourly')}
            disabled={isAggregationDisabled('hourly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              aggregation === 'hourly'
                ? 'bg-blue-500 text-white'
                : isAggregationDisabled('hourly')
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Hourly (Power)
          </button>
          <button
            onClick={() => !isAggregationDisabled('daily') && onAggregationChange('daily')}
            disabled={isAggregationDisabled('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              aggregation === 'daily'
                ? 'bg-blue-500 text-white'
                : isAggregationDisabled('daily')
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => !isAggregationDisabled('monthly') && onAggregationChange('monthly')}
            disabled={isAggregationDisabled('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              aggregation === 'monthly'
                ? 'bg-blue-500 text-white'
                : isAggregationDisabled('monthly')
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>
    </div>
    </>
  );
}