// src/components/mou/LogoUploader.jsx
// ==================================================
// 🖼️ Logo Uploader — used inside MOUGenerator top bar
// ==================================================
import React, { useState } from 'react';
import { Upload, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadLogo, deleteLogo } from '../../services/logoService';

export default function LogoUploader({ hospitalId, logoUrl, user, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const { url } = await uploadLogo(hospitalId, file, user);
      onChange(url);          // parent state update
    } catch (err) {
      console.error('Logo upload error:', err);
      setError(err.message || 'লোগো আপলোড ব্যর্থ হয়েছে');
    } finally {
      setUploading(false);
      e.target.value = '';    // reset input
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('লোগো মুছে ফেলবেন?')) return;
    setUploading(true);
    setError('');
    try {
      await deleteLogo(hospitalId);
      onChange(null);
    } catch (err) {
      console.error('Logo delete error:', err);
      setError(err.message || 'লোগো মুছতে সমস্যা হয়েছে');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        background: '#ffffff',
        border: '1px solid #d9dde5',
        borderRadius: '6px',
      }}
    >
      {/* Preview thumbnail */}
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Logo"
          style={{
            width: '24px',
            height: '24px',
            objectFit: 'contain',
            borderRadius: '4px',
            background: '#f4f6fa',
          }}
        />
      ) : (
        <ImageIcon size={16} color="#94a3b8" />
      )}

      {/* Upload input (hidden) */}
      <input
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        id="logo-upload-input"
        onChange={handleFile}
        style={{ display: 'none' }}
        disabled={uploading}
      />

      {/* Upload button */}
      <label
        htmlFor="logo-upload-input"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          padding: '3px 8px',
          background: uploading ? '#94a3b8' : '#f1f5f9',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: '11.5px',
          color: '#475569',
          fontWeight: '600',
        }}
      >
        {uploading ? (
          <Loader2 size={12} className="spin" />
        ) : (
          <Upload size={12} />
        )}
        {logoUrl ? 'পরিবর্তন' : 'লোগো'}
      </label>

      {/* Delete button */}
      {logoUrl && !uploading && (
        <button
          onClick={handleDelete}
          title="লোগো মুছুন"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 6px',
            background: 'transparent',
            border: '1px solid #fca5a5',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#b42318',
          }}
        >
          <Trash2 size={11} />
        </button>
      )}

      {/* Error display */}
      {error && (
        <span style={{ fontSize: '11px', color: '#b42318', marginLeft: '4px' }}>
          {error}
        </span>
      )}
    </div>
  );
}