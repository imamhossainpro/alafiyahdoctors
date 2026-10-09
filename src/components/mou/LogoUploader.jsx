// src/components/mou/LogoUploader.jsx
// ==================================================
// 🖼️ LogoUploader — Vercel Blob based
// ==================================================
// ✅ Upload via /api/upload (Vercel Blob)
// ✅ No Firebase Storage dependency
// ✅ Real-time logo display
// ==================================================

import React, { useRef, useState } from 'react';
import { Upload, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import {
  uploadLogo,
  deleteLogo,
} from '../../services/logoService';

export default function LogoUploader({
  hospitalId,
  logoUrl,
  user,
  onChange,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const result = await uploadLogo(hospitalId, file, user);

      if (onChange) onChange(result.url);

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'লোগো আপলোড ব্যর্থ');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('লোগো মুছে ফেলতে চান?')) return;

    setError('');
    setUploading(true);

    try {
      await deleteLogo(hospitalId);
      if (onChange) onChange(null);
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err.message || 'লোগো মুছতে সমস্যা হয়েছে');
    } finally {
      setUploading(false);
    }
  };

  const triggerUpload = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Thumbnail / Icon */}
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="MOU Logo"
          style={{
            width: 32,
            height: 32,
            objectFit: 'contain',
            borderRadius: 4,
            border: '1px solid #d9dde5',
            background: '#fff',
          }}
        />
      ) : (
        <div
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
            border: '1px dashed #d9dde5',
            background: '#f8fafc',
            color: '#94a3b8',
          }}
        >
          <ImageIcon size={14} />
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={triggerUpload}
        disabled={uploading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '6px 12px',
          background: '#ffffff',
          border: '1px solid #d9dde5',
          borderRadius: 6,
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: 13,
          color: '#1d2330',
          opacity: uploading ? 0.6 : 1,
        }}
        title="Upload MOU Logo"
      >
        {uploading ? (
          <Loader2 size={14} className="spin" />
        ) : (
          <Upload size={14} />
        )}
        {uploading ? 'আপলোড...' : 'লোগো'}
      </button>

      {/* Delete button */}
      {logoUrl && !uploading && (
        <button
          type="button"
          onClick={handleDelete}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            background: '#ffffff',
            border: '1px solid #fca5a5',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            color: '#b42318',
          }}
          title="Delete Logo"
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* Error tooltip */}
      {error && (
        <span
          style={{
            fontSize: 12,
            color: '#b42318',
            maxWidth: 200,
          }}
        >
          {error}
        </span>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}