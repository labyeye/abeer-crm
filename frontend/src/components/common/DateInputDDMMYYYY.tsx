import React from 'react';

type Props = {
  value?: string | null;
  onChange?: (v: string) => void;
  className?: string;
  id?: string;
  name?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
};

const formatDDMMYYYY = (iso?: string | null) => {
  if (!iso) return 'DD/MM/YYYY';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Invalid date';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch (e) {
    return 'Invalid date';
  }
};

const DateInputDDMMYYYY: React.FC<Props> = ({ value, onChange, className, id, name, min, max, disabled }) => {
  return (
    <div className={`flex items-center gap-3 ${className || ''}`}>
      <input
        id={id}
        name={name}
        type="date"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="px-3 py-2 border rounded bg-white"
        min={min}
        max={max}
        disabled={disabled}
      />
      <div className="text-sm text-gray-600 px-3 py-2 border rounded bg-gray-50">{formatDDMMYYYY(value)}</div>
    </div>
  );
};

export default DateInputDDMMYYYY;
