// src/components/admin/LogEntry.jsx
// ==================================================
// 📋 LogEntry — Beautiful Activity Log Card
// ==================================================
import React, { useState } from 'react';
import {
  User,
  Mail,
  Tag,
  Activity as ActivityIcon,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  History,
  Bookmark,
} from 'lucide-react';

// ==================================================
// ✅ Role Colors
// ==================================================
const ROLE_COLORS = {
  admin:       { bg: '#dbeafe', color: '#1e40af', label: 'Admin' },
  'sub-admin': { bg: '#ede9fe', color: '#6d28d9', label: 'Sub-Admin' },
  editor:      { bg: '#d1fae5', color: '#065f46', label: 'Editor' },
  moderator:   { bg: '#fef3c7', color: '#92400e', label: 'Moderator' },
  viewer:      { bg: '#f1f5f9', color: '#475569', label: 'Viewer' },
  pending:     { bg: '#fee2e2', color: '#991b1b', label: 'Pending' },
};

// ==================================================
// ✅ Action Colors
// ==================================================
const ACTION_COLORS = {
  CREATE:                   '#16a34a',
  UPDATE:                   '#2563eb',
  DELETE:                   '#dc2626',
  STATUS_CHANGE:            '#d97706',
  PATIENT_TYPE_CHANGE:      '#7c3aed',
  MARKETING_OFFICER_CHANGE: '#0891b2',
  LOCATION_CHANGE:          '#ea580c',
  ASSIGN:                   '#059669',
  UNASSIGN:                 '#64748b',
};

// ==================================================
// ✅ Time Helpers
// ==================================================
const getRelativeTime = (date) => {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 5) return 'এইমাত্র';
  if (diff < 60) return `${diff} সেকেন্ড আগে`;
  if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} দিন আগে`;
  return date.toLocaleDateString('en-GB');
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return { full: '—', relative: '' };
  let date;
  if (timestamp?.seconds) date = new Date(timestamp.seconds * 1000);
  else if (timestamp?.toDate) date = timestamp.toDate();
  else if (typeof timestamp === 'string') date = new Date(timestamp);
  else date = new Date(timestamp);
  if (isNaN(date.getTime())) return { full: '—', relative: '' };
  return {
    full: date.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }),
    relative: getRelativeTime(date),
  };
};

const shortUid = (uid) => {
  if (!uid) return '—';
  if (uid.length <= 14) return uid;
  return `${uid.slice(0, 6)}...${uid.slice(-4)}`;
};

const formatValue = (val) => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'object') {
    try { return JSON.stringify(val, null, 2); } catch { return String(val); }
  }
  return String(val);
};

// ==================================================
// ✅ Change Diff
// ==================================================
const ChangeDiff = ({ oldValue, newValue }) => {
  const hasOld = oldValue !== null && oldValue !== undefined;
  const hasNew = newValue !== null && newValue !== undefined;
  if (!hasOld && !hasNew) return null;

  return (
    <div style={{ marginTop: '12px', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
      <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <History size={13} /> Change Details
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 180px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px 10px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#991b1b', marginBottom: '4px', textTransform: 'uppercase' }}>Old</div>
          <pre style={{ margin: 0, color: '#7f1d1d', fontSize: '12px', fontFamily: "ui-monospace, Consolas, monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {formatValue(oldValue)}
          </pre>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '18px', fontWeight: '700', minWidth: '20px' }}>→</div>
        <div style={{ flex: '1 1 180px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 10px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#166534', marginBottom: '4px', textTransform: 'uppercase' }}>New</div>
          <pre style={{ margin: 0, color: '#14532d', fontSize: '12px', fontFamily: "ui-monospace, Consolas, monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {formatValue(newValue)}
          </pre>
        </div>
      </div>
    </div>
  );
};

// ==================================================
// ✅ MAIN LogEntry
// ==================================================
export default function LogEntry({ log }) {
  const [expanded, setExpanded] = useState(false);

  const roleStyle = ROLE_COLORS[log.userRole] || ROLE_COLORS.viewer;
  const actionColor = ACTION_COLORS[log.action] || '#64748b';
  const ts = formatTimestamp(log.timestamp);
  const hasChangeDiff =
    (log.oldValue !== null && log.oldValue !== undefined) ||
    (log.newValue !== null && log.newValue !== undefined);
  const initial = (log.userName || '?').charAt(0).toUpperCase();

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px 18px',
        transition: 'all 0.2s ease',
        fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.06)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      {/* Row 1: User Info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%',
          background: roleStyle.bg, color: roleStyle.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '800', fontSize: '16px', flexShrink: 0,
          border: `2px solid ${roleStyle.color}20`,
        }}>
          {initial}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <strong style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>
              {log.userName || 'অজানা ইউজার'}
            </strong>
            <span style={{
              background: roleStyle.bg, color: roleStyle.color,
              padding: '2px 9px', borderRadius: '12px',
              fontSize: '10.5px', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.3px',
            }}>
              {roleStyle.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', color: '#64748b', flexWrap: 'wrap' }}>
            {log.userId && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace' }} title={`Full ID: ${log.userId}`}>
                <User size={11} /> ID: {shortUid(log.userId)}
              </span>
            )}
            {log.userEmail && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={11} /> {log.userEmail}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, fontSize: '11.5px', color: '#64748b' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: '#475569' }}>
            <Clock size={11} /> {ts.relative}
          </span>
          <span style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
            {ts.full}
          </span>
        </div>
      </div>

      {/* Row 2: Module + Action Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <span style={{
          background: '#f1f5f9', color: '#475569',
          padding: '3px 11px', borderRadius: '12px',
          fontSize: '11.5px', fontWeight: '600',
          display: 'inline-flex', alignItems: 'center', gap: '5px',
        }}>
          <Tag size={11} /> {log.module || '—'}
        </span>

        <span style={{
          background: `${actionColor}18`, color: actionColor,
          padding: '3px 11px', borderRadius: '12px',
          fontSize: '11.5px', fontWeight: '700',
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          border: `1px solid ${actionColor}30`,
        }}>
          <ActivityIcon size={11} /> {log.action || '—'}
        </span>
      </div>

      {/* Row 3: Description */}
      {log.description && (
        <div style={{
          fontSize: '13.5px', color: '#334155', lineHeight: '1.6',
          padding: '10px 12px', background: '#f8fafc', borderRadius: '8px',
          borderLeft: `3px solid ${actionColor}`,
          display: 'flex', alignItems: 'flex-start', gap: '8px',
        }}>
          <FileText size={14} color={actionColor} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{log.description}</span>
        </div>
      )}

      {/* Row 4: Record ID + Expand Button */}
      {(log.recordId || hasChangeDiff) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
          {log.recordId && (
            <div style={{ fontSize: '11.5px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Bookmark size={11} />
              <strong style={{ color: '#475569' }}>Record:</strong>
              <code style={{
                background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px',
                fontSize: '11px', fontFamily: "ui-monospace, Consolas, monospace",
                color: '#1e293b',
              }} title={log.recordId}>
                {log.recordId}
              </code>
            </div>
          )}

          {hasChangeDiff && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: expanded ? '#1c5fa8' : '#f1f5f9',
                color: expanded ? '#fff' : '#1c5fa8',
                border: 'none', padding: '5px 12px', borderRadius: '6px',
                cursor: 'pointer', fontSize: '11.5px', fontWeight: '600',
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                transition: 'all 0.2s',
              }}
            >
              {expanded ? <><ChevronUp size={12} /> Hide Details</> : <><ChevronDown size={12} /> Show Changes</>}
            </button>
          )}
        </div>
      )}

      {/* Row 5: Expanded Diff */}
      {expanded && hasChangeDiff && (
        <ChangeDiff oldValue={log.oldValue} newValue={log.newValue} />
      )}
    </div>
  );
}