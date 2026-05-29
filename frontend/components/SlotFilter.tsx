'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';

interface SlotFilterProps {
  onFilterChange?: (filters: SlotFilters) => void;
  onSearch?: (query: string) => void;
}

export interface SlotFilters {
  timeOfDay: 'all' | 'morning' | 'afternoon' | 'evening' | 'night';
  availability: 'all' | 'available' | 'booked';
  searchTerm: string;
}

export default function SlotFilter({ onFilterChange, onSearch }: SlotFilterProps) {
  const [filters, setFilters] = useState<SlotFilters>({
    timeOfDay: 'all',
    availability: 'all',
    searchTerm: '',
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleTimeChange = (time: SlotFilters['timeOfDay']) => {
    const newFilters = { ...filters, timeOfDay: time };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleAvailabilityChange = (avail: SlotFilters['availability']) => {
    const newFilters = { ...filters, availability: avail };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSearchChange = (term: string) => {
    const newFilters = { ...filters, searchTerm: term };
    setFilters(newFilters);
    onSearch?.(term);
  };

  const handleReset = () => {
    const newFilters = {
      timeOfDay: 'all' as const,
      availability: 'all' as const,
      searchTerm: '',
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
    onSearch?.('');
  };

  const hasActiveFilters =
    filters.timeOfDay !== 'all' ||
    filters.availability !== 'all' ||
    filters.searchTerm !== '';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 rounded-xl border border-gray-300 space-y-4"
    >
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search slots: e.g., '7 PM', 'Saturday', 'morning'..."
          value={filters.searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Time Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Time:</span>
          <div className="flex gap-2">
            {['all', 'morning', 'afternoon', 'evening', 'night'].map((time) => (
              <motion.button
                key={time}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  handleTimeChange(time as SlotFilters['timeOfDay'])
                }
                className={`
                  px-3 py-1 rounded-lg text-xs font-semibold transition-all
                  ${
                    filters.timeOfDay === time
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }
                `}
              >
                {time === 'all'
                  ? 'All'
                  : time === 'morning'
                    ? '🌅 Morning'
                    : time === 'afternoon'
                      ? '☀️ Afternoon'
                      : time === 'evening'
                        ? '🌅 Evening'
                        : '🌙 Night'}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Availability Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Status:</span>
          <div className="flex gap-2">
            {['all', 'available', 'booked'].map((avail) => (
              <motion.button
                key={avail}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  handleAvailabilityChange(
                    avail as SlotFilters['availability']
                  )
                }
                className={`
                  px-3 py-1 rounded-lg text-xs font-semibold transition-all
                  ${
                    filters.availability === avail
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }
                `}
              >
                {avail === 'all'
                  ? 'All'
                  : avail === 'available'
                    ? '✅ Available'
                    : '❌ Booked'}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition-all flex items-center gap-1"
          >
            <X className="w-4 h-4" /> Reset
          </motion.button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded-lg">
          <span className="font-semibold text-blue-900">Active filters:</span>
          {filters.timeOfDay !== 'all' && <span> • Time: {filters.timeOfDay}</span>}
          {filters.availability !== 'all' && (
            <span> • Status: {filters.availability}</span>
          )}
          {filters.searchTerm && <span> • Search: "{filters.searchTerm}"</span>}
        </div>
      )}
    </motion.div>
  );
}
