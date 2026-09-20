// src/components/ui/Skeleton.jsx
import React from 'react';

// ==================================================
// 🎨 Shimmer Animation CSS
// ==================================================
const SkeletonCSS = `
@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes skeleton-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.skeleton-base {
  background: linear-gradient(
    90deg,
    #e9edf2 0%,
    #f5f8fb 40%,
    #e9edf2 80%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.skeleton-base.dark {
  background: linear-gradient(
    90deg,
    #dce3ea 0%,
    #eef2f6 40%,
    #dce3ea 80%
  );
  background-size: 200% 100%;
}

.skeleton-circle {
  border-radius: 50%;
}

.skeleton-fade-in {
  animation: skeleton-fade-in 0.4s ease both;
}

/* ✅ Content fade-in when loaded */
.content-fade-in {
  animation: skeleton-fade-in 0.5s ease both;
}
`;

// ==================================================
// ✅ Base Skeleton Component
// ==================================================
export function Skeleton({
  width = '100%',
  height = 16,
  circle = false,
  className = '',
  dark = false,
  style = {},
}) {
  return (
    <>
      <style>{SkeletonCSS}</style>
      <div
        className={`skeleton-base ${circle ? 'skeleton-circle' : ''} ${dark ? 'dark' : ''} ${className}`}
        style={{
          width,
          height: typeof height === 'number' ? `${height}px` : height,
          ...style,
        }}
      />
    </>
  );
}

// ==================================================
// ✅ Text Line Skeleton (auto width variance)
// ==================================================
export function SkeletonText({ lines = 3, width = '100%', lineHeight = 12, gap = 8 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : width}
          height={lineHeight}
        />
      ))}
    </div>
  );
}

// ==================================================
// ✅ Avatar + Text Combo
// ==================================================
export function SkeletonAvatar({ size = 40 }) {
  return <Skeleton width={size} height={size} circle />;
}

// ==================================================
// ✅ Card Block
// ==================================================
export function SkeletonCard({ height = 120, className = '' }) {
  return <Skeleton height={height} className={className} style={{ borderRadius: 12 }} />;
}