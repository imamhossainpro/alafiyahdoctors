// api/upload.js
// ==================================================
// ⬆️ Vercel Blob Upload API
// ==================================================
// ✅ Accepts multipart/form-data
// ✅ Images only, max 3MB
// ✅ Returns { url, pathname }
// ==================================================

import { put } from '@vercel/blob';
import { IncomingForm } from 'formidable';
import fs from 'fs';

// ⚠️ Vercel Functions-এ default body parser বন্ধ করতে হবে
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // ✅ CORS headers (safety)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ✅ Formidable দিয়ে multipart/form-data parse
    const form = new IncomingForm({ maxFileSize: 3 * 1024 * 1024 });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // ⚠️ formidable version অনুযায়ী files.file array বা object
    let file = files.file;
    if (Array.isArray(file)) file = file[0];

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // ✅ MIME type check
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only images allowed' });
    }

    // ✅ File read করে Buffer
    const fileBuffer = fs.readFileSync(file.filepath);

    if (fileBuffer.length > 3 * 1024 * 1024) {
      return res.status(400).json({ error: 'Max 3MB' });
    }

    // ✅ Vercel Blob-এ upload
    const blob = await put(
      `doctors/${Date.now()}-${file.originalFilename || 'image.jpg'}`,
      fileBuffer,
      {
        access: 'public',
        addRandomSuffix: true,
        contentType: file.mimetype,
      }
    );

    return res.status(200).json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message });
  }
}