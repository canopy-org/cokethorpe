'use client';

interface DateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const ranges = [
    { label: 'Last Hour', value: '-1h' },
    { label: 'Last 6 Hours', value: '-6h' },
    { label: 'Last 24 Hours', value: '-24h' },
    { label: 'Last 7 Days', value: '-7d' },
    { label: 'Last 30 Days', value: '-30d' },
    { label: 'Last 90 Days', value: '-90d' },
  ];

  return (
    <div className="flex items-center gap-3 mb-4">
      <label className="text-sm font-medium text-gray-700">Time Range:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
      >
        {ranges.map((range) => (
          <option key={range.value} value={range.value}>
            {range.label}
          </option>
        ))}
      </select>
    </div>
  );
}