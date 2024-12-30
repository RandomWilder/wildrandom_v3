import { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';

interface PrizeValueInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
}

export function PrizeValueInput({ 
  label, 
  value, 
  onChange, 
  error,
  disabled = false 
}: PrizeValueInputProps) {
  const [displayValue, setDisplayValue] = useState(value.toString());

  useEffect(() => {
    setDisplayValue(value.toString());
  }, [value]);

  const handleChange = (newValue: string) => {
    setDisplayValue(newValue);
    const numericValue = parseFloat(newValue) || 0;
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative rounded-lg shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <DollarSign className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="number"
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          min="0"
          step="0.01"
          className={`
            block w-full pl-10 pr-4 py-2 rounded-lg
            border ${error ? 'border-red-300' : 'border-gray-300'}
            focus:outline-none focus:ring-2 
            ${error 
              ? 'focus:ring-red-500 focus:border-red-500' 
              : 'focus:ring-indigo-500 focus:border-indigo-500'
            }
            disabled:bg-gray-50 disabled:text-gray-500
          `}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}