import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFoundCSS = `
  .not-found-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #f8fafc;
    font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif;
    padding: 20px;
    box-sizing: border-box;
  }

  .not-found-card {
    background: #ffffff;
    border-radius: 24px;
    padding: 60px 40px;
    max-width: 420px;
    width: 100%;
    text-align: center;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06);
    border: 1px solid #e2e8f0;
    animation: fadeUp 0.5s ease;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .not-found-title {
    font-size: 120px;
    font-weight: 800;
    line-height: 1;
    margin: 0;
    background: linear-gradient(135deg, #0d9488, #1d4ed8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -5px;
    margin-bottom: 20px;
  }

  .not-found-message {
    font-size: 18px;
    font-weight: 600;
    color: #334155;
    margin: 0 0 8px 0;
  }

  .not-found-subtext {
    font-size: 14px;
    color: #94a3b8;
    margin: 0 0 32px 0;
    line-height: 1.6;
  }

  .not-found-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    font-size: 15px;
    font-weight: 700;
    border-radius: 12px;
    border: 1.5px solid #0f766e;
    background: transparent;
    color: #0f766e;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .not-found-btn:hover {
    background: #0f766e;
    color: #ffffff;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(15, 118, 110, 0.2);
  }
`;

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found-wrapper">
      <style>{NotFoundCSS}</style>
      
      <div className="not-found-card">
        <h1 className="not-found-title">404</h1>
        <p className="not-found-message">404 Not Page Not Found.</p>
        <p className="not-found-subtext">দুঃখিত, আপনি যে পেইজটি খুঁজছেন সেটি নেই অথবা সরিয়ে ফেলা হয়েছে।</p>
        
        <button className="not-found-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> হোমপেইজে ফিরে যান
        </button>
      </div>
    </div>
  );
}