// api/delete-logo.js
// ==================================================
// 🗑️ Delete Logo — Vercel Blob
// ==================================================
import { del } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body || {};

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }

    // Vercel Blob থেকে delete
    await del(url);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logo delete error:', error);
    return res.status(500).json({ error: error.message });
  }
}