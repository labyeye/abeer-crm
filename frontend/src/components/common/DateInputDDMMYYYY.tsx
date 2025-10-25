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
    </div>
  );
};

export default DateInputDDMMYYYY;
