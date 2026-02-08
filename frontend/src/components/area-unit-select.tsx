'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AREA_UNITS, type AreaUnit } from '@/lib/utils';

interface AreaUnitSelectProps {
  value: AreaUnit;
  onChange: (unit: AreaUnit) => void;
  className?: string;
}

export function AreaUnitSelect({ value, onChange, className }: AreaUnitSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AreaUnit)}>
      <SelectTrigger className={className || 'w-[160px]'}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(AREA_UNITS).map(([key, { label }]) => (
          <SelectItem key={key} value={key}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
