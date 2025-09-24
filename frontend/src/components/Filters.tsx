import React from 'react';

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
    <div className="p-4 bg-gray-50 border-b border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filters.map((filter) => (
          <div key={filter.key}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            {filter.type === 'select' && (
              <select
                value={filterState[filter.key] || ''}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{`All ${filter.label}s`}</option>
                {filter.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            {filter.type === 'text' && (
              <input
                type="text"
                value={filterState[filter.key] || ''}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
            {filter.type === 'date' && (
              <input
                type="date"
                value={filterState[filter.key] || ''}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
            {filter.type === 'number' && (
              <input
                type="number"
                step="0.01"
                value={filterState[filter.key] || ''}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          onClick={onClear}
          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Clear All
        </button>
        <button
          onClick={onApply}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
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
      className="flex items-center gap-1 hover:text-gray-900 transition-colors font-medium"
    >
      {label}
      {isActive && (
        <svg 
          className={`w-4 h-4 transition-transform ${direction === 'desc' ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
        </svg>
      )}
      {!isActive && (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      )}
    </button>
  );
};