import React from 'react';
import { ChevronUp, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type FilterType = 'text' | 'select' | 'date' | 'number';

export interface FilterDef {
  key: string;
  label: string;
  type: FilterType;
  options?: string[];
  placeholder?: string;
}

export interface FilterPanelProps {
  filters: FilterDef[];
  filterState: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  onApply: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  filterState,
  onFilterChange,
  onClear,
  onApply,
}) => {
  return (
    <div className="p-4 bg-muted/50 border-b">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filters.map((filter) => (
          <div key={filter.key} className="space-y-1">
            <Label htmlFor={`filter-${filter.key}`}>{filter.label}</Label>
            {filter.type === 'select' && (
              <Select
                value={filterState[filter.key] || ''}
                onValueChange={(value) => onFilterChange(filter.key, value === '__all__' ? '' : value)}
              >
                <SelectTrigger id={`filter-${filter.key}`}>
                  <SelectValue placeholder={`All ${filter.label}s`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{`All ${filter.label}s`}</SelectItem>
                  {filter.options?.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filter.type === 'text' && (
              <Input
                id={`filter-${filter.key}`}
                type="text"
                value={filterState[filter.key] || ''}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
              />
            )}
            {filter.type === 'date' && (
              <Input
                id={`filter-${filter.key}`}
                type="date"
                value={filterState[filter.key] || ''}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
              />
            )}
            {filter.type === 'number' && (
              <Input
                id={`filter-${filter.key}`}
                type="number"
                step="0.01"
                value={filterState[filter.key] || ''}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear All
        </Button>
        <Button size="sm" onClick={onApply}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export interface SortConfig {
  field: string | null;
  direction: 'asc' | 'desc';
}

export interface SortableHeaderProps {
  field: string;
  label: React.ReactNode;
  sortConfig: SortConfig;
  onSort: (field: string) => void;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  field,
  label,
  sortConfig,
  onSort,
}) => {
  const isActive = sortConfig.field === field;
  const direction = isActive ? sortConfig.direction : 'asc';

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
    >
      {label}
      {isActive ? (
        <ChevronUp
          className={`w-4 h-4 transition-transform ${direction === 'desc' ? 'rotate-180' : ''}`}
        />
      ) : (
        <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );
};