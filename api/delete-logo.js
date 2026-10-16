// api/upload-logo.js
import { put } from '@vercel/blob';
import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm({
      maxFileSize: 2 * 1024 * 1024, // 2MB
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    let file = files.file;
    if (Array.isArray(file)) file = file[0];

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only images allowed' });
    }

    const fileBuffer = fs.readFileSync(file.filepath);

    if (fileBuffer.length > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'Max 2MB allowed for logo' });
    }

    // ✅ logos/ folder-এ আপলোড
    const blob = await put(
      `logos/${Date.now()}-${file.originalFilename || 'logo.png'}`,
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
    console.error('Logo upload error:', error);
    return res.status(500).json({ error: error.message });
  }
}