// src/components/all-doctors/SearchBar.jsx
// ==================================================
// 🔍 SearchBar — Search + filter toolbar
// ==================================================
import React from 'react';
import { Search, X, Filter } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  totalCount,
  filteredCount,
  onClear,
  hasActiveFilter,
}) {
  return (
    <div className="ad-searchbar">
      <div className="ad-searchbar-input">
        <Search size={18} color="#64748b" />
        <input
          type="text"
          placeholder="ডাক্তারের নাম, বিশেষত্ব বা বিভাগ দিয়ে খুঁজুন..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="ডাক্তার সার্চ"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="ad-searchbar-clear"
            aria-label="সার্চ মুছুন"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="ad-searchbar-meta">
        <span className="ad-searchbar-count">
          <Filter size={13} />
          {hasActiveFilter
            ? `${filteredCount} / ${totalCount} জন ডাক্তার`
            : `মোট ${totalCount} জন ডাক্তার`}
        </span>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={onClear}
            className="ad-searchbar-reset"
          >
            <X size={13} />
            ফিল্টার রিসেট
          </button>
        )}
      </div>
    </div>
  );
}