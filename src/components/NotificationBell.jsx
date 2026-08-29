import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, Check, Stethoscope } from 'lucide-react';
import { db, collection, onSnapshot, query, where, doc, updateDoc } from '../firebase';

const BellCSS = `
.notification-bell-wrapper { position: relative; }
.notification-bell-btn { background: transparent; border: none; cursor: pointer; position: relative; padding: 8px; color: #154a82; display: flex; align-items: center; }
.notification-bell-btn:hover { color: #1c5fa8; transform: scale(1.1); transition: 0.2s; }
.bell-badge { position: absolute; top: -2px; right: -2px; background: #dc2626; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 5px; border-radius: 50%; border: 2px solid #fff; }
.notification-dropdown { position: absolute; right: 0; top: 45px; width: 340px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 100; overflow: hidden; }
.notification-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.notification-header h4 { margin: 0; font-size: 15px; color: #1e293b; }
.notification-header button { background: transparent; border: none; color: #64748b; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.notification-list { max-height: 350px; overflow-y: auto; padding: 0; }

/* নতুন (Unread) - হালকা সবুজ ব্যাকগ্রাউন্ড */
.notification-item.unread { background: #f0fdf4; border-left: 4px solid #22c55e; }
.notification-item { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; display: flex; gap: 10px; align-items: center; transition: background 0.2s; }
.notification-item:hover { background: #f8fafc; }
.notification-item:last-child { border-bottom: none; }
.notification-icon { width: 36px; height: 36px; border-radius: 50%; background: #eff6ff; color: #1c5fa8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.notification-content { flex: 1; min-width: 0; }
.notification-title { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 2px; }
.notification-sub { font-size: 12px; color: #64748b; }
.notification-datetime { font-size: 11px; color: #94a3b8; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
.empty-notification { padding: 30px; text-align: center; color: #64748b; font-size: 13px; }
.notification-read-btn { background: transparent; border: none; cursor: pointer; color: #94a3b8; padding: 6px; border-radius: 50%; transition: all 0.2s; }
.notification-read-btn:hover { background: #dcfce7; color: #22c55e; }
`;

const timeAgo = (date) => {
  if (!date || isNaN(date.getTime())) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds} সেকেন্ড আগে`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} মিনিট আগে`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ঘণ্টা আগে`;
  const days = Math.floor(hours / 24);
  return `${days} দিন আগে`;
};

export default function NotificationBell({ user }) {
  const allowedRoles = ['admin', 'sub-admin', 'editor'];
  const canView = user && allowedRoles.includes(user.role);

  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const prevIdsRef = useRef(new Set());

  // ব্রাউজার নোটিফিকেশন পারমিশন
  useEffect(() => {
    if (!canView) return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [canView]);

  // ফায়ারবেস থেকে শুধু আনরিড অ্যাপয়েন্টমেন্ট লোড
  useEffect(() => {
    if (!canView) return;

    const q = query(collection(db, 'appointments'), where('isRead', '==', false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      const currentIds = new Set();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // আমরা শুধু 'isNew' true থাকলেও দেখাব, কিন্তু ফিল্টার isRead false ই যথেষ্ট
        // তবে আমরা চাই নতুন অ্যাপয়েন্টমেন্টগুলো হাইলাইট থাকবে, isNew দিয়ে আমরা আলাদা করতে পারি
        // কিন্তু isRead false মানেই আনরিড, তাই সব আনরিড দেখাব
        // সময় পার্সিং
        let date = new Date();
        if (data.timestamp) {
          if (typeof data.timestamp === 'object' && data.timestamp.seconds) {
            date = new Date(data.timestamp.seconds * 1000);
          } else {
            date = new Date(data.timestamp);
          }
        }
        const notif = {
          id: doc.id,
          name: data.name || 'অজানা রোগী',
          doctor: data.doctorName || 'অজানা ডাক্তার',
          time: date,
          isNew: data.isNew || false // নতুন কিনা জানতে
        };
        items.push(notif);
        currentIds.add(doc.id);
      });

      // সাজানো (নতুন -> পুরনো)
      items.sort((a, b) => b.time - a.time);
      setUnreadNotifications(items);
      setLoading(false);

      // নতুন আইডি ডিটেক্ট করে ব্রাউজার নোটিফিকেশন পাঠানো
      const newIds = new Set([...currentIds].filter(id => !prevIdsRef.current.has(id)));
      if (newIds.size > 0 && !loading) {
        newIds.forEach(id => {
          const notif = items.find(n => n.id === id);
          if (notif && "Notification" in window && Notification.permission === "granted") {
            new Notification("🆕 নতুন সিরিয়াল বুকিং!", {
              body: `${notif.name} - ${notif.doctor}`,
              icon: "/logo.png"
            });
          }
        });
      }
      prevIdsRef.current = currentIds;
    });

    return () => unsubscribe();
  }, [canView, loading]);

  // মার্ক এজ রিড (টিক ক্লিক)
  const handleMarkAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { isRead: true });
      // রিয়েল-টাইম আপডেটের কারণে লিস্ট অটো আপডেট হবে
    } catch (error) {
      console.error('Error marking as read:', error);
      alert('রিড করতে সমস্যা হয়েছে');
    }
  };

  // মার্ক অল রিড
  const handleMarkAllRead = async () => {
    try {
      const promises = unreadNotifications.map(n => 
        updateDoc(doc(db, 'appointments', n.id), { isRead: true })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all as read:', error);
      alert('সব রিড করতে সমস্যা হয়েছে');
    }
  };

  if (!canView) return null;

  const unreadCount = unreadNotifications.length;

  return (
    <div className="notification-bell-wrapper">
      <style>{BellCSS}</style>
      
      <button className="notification-bell-btn" onClick={() => setShowDropdown(!showDropdown)}>
        {unreadCount > 0 ? <BellRing size={22} /> : <Bell size={22} />}
        {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notification-dropdown" onMouseLeave={() => setShowDropdown(false)}>
          <div className="notification-header">
            <h4>নতুন বুকিং</h4>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}>
                <Check size={14} /> সব পড়া হয়েছে
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {loading ? (
              <div className="empty-notification">লোড হচ্ছে...</div>
            ) : unreadNotifications.length === 0 ? (
              <div className="empty-notification">কোনো নতুন নোটিফিকেশন নেই</div>
            ) : (
              unreadNotifications.map((notif) => (
                <div key={notif.id} className="notification-item unread">
                  <div className="notification-icon"><Stethoscope size={18} /></div>
                  <div className="notification-content">
                    <div className="notification-title">{notif.name}</div>
                    <div className="notification-sub">ডাক্তার: {notif.doctor}</div>
                    <div className="notification-datetime">🕒 {timeAgo(notif.time)}</div>
                  </div>
                  
                  <button 
                    className="notification-read-btn" 
                    onClick={() => handleMarkAsRead(notif.id)}
                    title="পড়া হয়েছে হিসেবে চিহ্নিত করুন"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}