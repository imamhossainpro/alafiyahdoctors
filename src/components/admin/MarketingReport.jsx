import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileText, Trash2 } from 'lucide-react';
import { db, doc, setDoc, collection, query, where, getDocs, updateDoc } from '../../firebase';

// ---------- 📄 অফিসার-নির্দিষ্ট PDF এক্সপোর্ট ----------
const exportOfficerPDF = async (officerName, appointments) => {
  const officerAppointments = appointments.filter(a => a.marketingOfficer === officerName);
  if (officerAppointments.length === 0) {
    alert('এই অফিসারের জন্য কোনো রোগী নেই');
    return;
  }

  try {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.background = '#ffffff';
    container.style.padding = '20px';
    container.style.fontFamily = "'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif";
    container.style.width = '1200px';
    document.body.appendChild(container);

    const header = document.createElement('h2');
    header.textContent = `${officerName} - মার্কেটিং রিপোর্ট`;
    header.style.marginBottom = '10px';
    header.style.color = '#1c5fa8';
    container.appendChild(header);

    const dateInfo = document.createElement('p');
    const today = new Date().toISOString().split('T')[0];
    dateInfo.textContent = `তারিখ: ${today}  |  মোট রোগী: ${officerAppointments.length} জন`;
    dateInfo.style.marginBottom = '20px';
    container.appendChild(dateInfo);

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '14px';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['সিরিয়াল', 'রোগীর নাম', 'মোবাইল', 'রেফারেল সোর্স', 'ডাক্তার', 'তারিখ', 'স্ট্যাটাস'];
    headers.forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      th.style.padding = '10px';
      th.style.background = '#1c5fa8';
      th.style.color = '#fff';
      th.style.border = '1px solid #ddd';
      th.style.textAlign = 'left';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    officerAppointments.forEach(a => {
      const tr = document.createElement('tr');
      const cells = [
        a.serialNo || '-',
        a.name || '-',
        a.mobile || '-',
        a.referralSource || '-',
        a.doctorName || '-',
        a.bookingDate || '-',
        a.status || 'pending'
      ];
      cells.forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        td.style.padding = '8px 10px';
        td.style.border = '1px solid #ddd';
        td.style.textAlign = 'left';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    const footer = document.createElement('p');
    footer.textContent = 'পৃষ্ঠা 1 / 1';
    footer.style.marginTop = '15px';
    footer.style.fontSize = '12px';
    footer.style.color = '#64748b';
    container.appendChild(footer);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${officerName}_marketing_report.pdf`);
  } catch (error) {
    console.error('PDF Export Error:', error);
    alert('PDF ডাউনলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
  }
};

// ---------- মূল কম্পোনেন্ট ----------
export default function MarketingReport({ 
  appointments, 
  marketingTeam, 
  onTeamUpdate, 
  user           
}) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedOfficer, setSelectedOfficer] = useState('all');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [deletingId, setDeletingId] = useState(null);

  const isAdmin = user?.role === 'admin';

  // ফিল্টার লজিক
  const filtered = useMemo(() => {
    return appointments.filter(a => {
      if (!a.bookingDate) return false;
      const dateMatch = a.bookingDate >= startDate && a.bookingDate <= endDate;
      const officerMatch = selectedOfficer === 'all' || a.marketingOfficer === selectedOfficer;
      return dateMatch && officerMatch;
    });
  }, [appointments, startDate, endDate, selectedOfficer]);

  // রিপোর্ট ডেটা
  const reportData = useMemo(() => {
    const groups = {};
    filtered.forEach(a => {
      const officer = a.marketingOfficer || 'Unassigned';
      if (!groups[officer]) {
        groups[officer] = { total: 0, sources: {}, completed: 0, checkedIn: 0 };
      }
      groups[officer].total++;
      const src = a.referralSource || 'Unknown';
      groups[officer].sources[src] = (groups[officer].sources[src] || 0) + 1;
      if (a.status === 'completed') groups[officer].completed++;
      if (a.status === 'checked-in') groups[officer].checkedIn++;
    });
    return Object.entries(groups).map(([name, data]) => ({
      name,
      total: data.total,
      sources: data.sources,
      completed: data.completed,
      checkedIn: data.checkedIn,
      conversionRate: data.total > 0 ? (((data.completed + data.checkedIn) / data.total) * 100).toFixed(1) : 0
    }));
  }, [filtered]);

  // 🗑️ ডিলেট ফাংশন (অ্যাপয়েন্টমেন্ট আপডেট সহ)
  const handleDelete = async (officerName) => {
    if (!isAdmin) {
      alert('শুধুমাত্র অ্যাডমিন অফিসার ডিলিট করতে পারবেন।');
      return;
    }

    if (!confirm(`আপনি কি "${officerName}" অফিসারকে ডিলিট করতে চান?`)) return;
    if (!confirm(`আপনি কি নিশ্চিত? "${officerName}" অফিসারকে স্থায়ীভাবে মুছে ফেলা হবে!`)) return;

    try {
      setDeletingId(officerName);

      // ১. অফিসারকে টিম থেকে বাদ দেওয়া
      const updatedTeam = marketingTeam.filter(m => {
        const name = typeof m === 'string' ? m : m.name;
        return name !== officerName;
      });
      await setDoc(doc(db, 'master', 'marketingTeam'), { members: updatedTeam });

      // ২. 🔥 অ্যাপয়েন্টমেন্ট আপডেট করা - যাদের marketingOfficer = officerName, তাদের খালি করা
      const q = query(collection(db, 'appointments'), where('marketingOfficer', '==', officerName));
      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(docSnap => 
        updateDoc(doc(db, 'appointments', docSnap.id), { marketingOfficer: '' })
      );
      await Promise.all(updatePromises);

      // ৩. প্যারেন্ট স্টেট আপডেট
      if (onTeamUpdate) onTeamUpdate(updatedTeam);
      alert(`${officerName} সফলভাবে ডিলিট করা হয়েছে এবং তার সাথে যুক্ত সব রোগীর অফিসার ফিল্ড খালি করা হয়েছে।`);
    } catch (error) {
      console.error('Delete error:', error);
      alert('ডিলিট করতে সমস্যা হয়েছে।');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 15px 0' }}>📊 মার্কেটিং রিপোর্ট</h3>
      
      {/* ফিল্টার */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>অফিসার</label>
          <select 
            value={selectedOfficer} 
            onChange={(e) => setSelectedOfficer(e.target.value)} 
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', minWidth: '150px' }}
          >
            <option value="all">সব অফিসার</option>
            {marketingTeam.map((m, idx) => {
              const name = typeof m === 'string' ? m : m.name;
              const key = typeof m === 'string' ? idx : m.id || idx;
              return <option key={key} value={name}>{name}</option>;
            })}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>শুরু</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px' }} 
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>শেষ</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px' }} 
          />
        </div>
      </div>

      {/* টেবিল */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px' }}>অফিসার</th>
              <th style={{ padding: '10px 12px' }}>মোট রোগী</th>
              <th style={{ padding: '10px 12px' }}>চেক-ইন</th>
              <th style={{ padding: '10px 12px' }}>কমপ্লিট</th>
              <th style={{ padding: '10px 12px' }}>কনভার্সন রেট</th>
              <th style={{ padding: '10px 12px' }}>সোর্স ব্রেকডাউন</th>
              {isAdmin && <th style={{ padding: '10px 12px', textAlign: 'center' }}>অ্যাকশন</th>}
            </tr>
          </thead>
          <tbody>
            {reportData.length === 0 ? (
              <tr><td colSpan={isAdmin ? 7 : 6} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>কোনো ডেটা পাওয়া যায়নি</td></tr>
            ) : (
              reportData.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 12px', fontWeight: '700' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{row.name}</span>
                      {row.name !== 'Unassigned' && (
                        <button 
                          onClick={() => exportOfficerPDF(row.name, filtered)}
                          title={`${row.name} এর বিস্তারিত রিপোর্ট ডাউনলোড`}
                          style={{ 
                            background: '#dc2626', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '4px', 
                            padding: '3px 10px', 
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: '600'
                          }}
                        >
                          <FileText size={13} /> PDF
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{row.total}</td>
                  <td style={{ padding: '10px 12px' }}>{row.checkedIn}</td>
                  <td style={{ padding: '10px 12px' }}>{row.completed}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '600', color: row.conversionRate > 50 ? '#22c55e' : '#d97706' }}>{row.conversionRate}%</td>
                  <td style={{ padding: '10px 12px' }}>
                    {Object.entries(row.sources).map(([k, v]) => (
                      <span key={k} style={{ background: '#eef1f7', padding: '2px 10px', borderRadius: '12px', marginRight: '4px', fontSize: '12px', display: 'inline-block', marginBottom: '4px' }}>
                        {k}: {v}
                      </span>
                    ))}
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {row.name !== 'Unassigned' && (
                        <button
                          onClick={() => handleDelete(row.name)}
                          disabled={deletingId === row.name}
                          style={{
                            background: deletingId === row.name ? '#94a3b8' : '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            cursor: deletingId === row.name ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={14} /> 
                          {deletingId === row.name ? 'ডিলিট হচ্ছে...' : 'ডিলিট'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}