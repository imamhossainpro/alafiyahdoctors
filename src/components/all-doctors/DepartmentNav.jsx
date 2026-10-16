// src/components/all-doctors/DepartmentNav.jsx
// ==================================================
// 🧭 DepartmentNav — Filter pills by department
// ==================================================
import React from 'react';

export default function DepartmentNav({
  departments,
  activeDeptId,
  onChange,
}) {
  if (!departments || departments.length === 0) return null;

  return (
    <div className="ad-dept-nav" role="tablist" aria-label="বিভাগ">
      <button
        type="button"
        role="tab"
        aria-selected={activeDeptId === 'all'}
        className={`ad-dept-pill ${activeDeptId === 'all' ? 'is-active' : ''}`}
        onClick={() => onChange('all')}
      >
        <span className="ad-dept-pill-count">
          {departments.reduce((s, d) => s + d.doctors.length, 0)}
        </span>
        সকল বিভাগ
      </button>

      {departments.map((dept) => {
        const isActive = activeDeptId === dept.id;
        return (
          <button
            key={dept.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`ad-dept-pill ${isActive ? 'is-active' : ''}`}
            onClick={() => onChange(dept.id)}
            style={
              isActive
                ? { background: dept.color || '#1c5fa8', borderColor: dept.color || '#1c5fa8' }
                : undefined
            }
          >
            <span className="ad-dept-pill-count">{dept.doctors.length}</span>
            {dept.name}
          </button>
        );
      })}
    </div>
  );
}