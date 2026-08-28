import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, CheckCheck, Stethoscope, Check } from 'lucide-react';
import { db, collection, onSnapshot, query, orderBy } from '../firebase';

const BellCSS = `
.notification-bell-wrapper { position: relative; }
.notification-bell-btn { background: transparent; border: none; cursor: pointer; position: relative; padding: 8px; color: #154a82; display: flex; align-items: center; }
.notification-bell-btn:hover { color: #1c5fa8; transform: scale(1.1); transition: 0.2s; }
.bell-badge { position: absolute; top: -2px; right: -2px; background: #dc2626; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 5px; border-radius: 50%; border: 2px solid #fff; }
.notification-dropdown { position: absolute; right: 0; top: 45px; width: 340px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 100; overflow: hidden; }
.notification-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.notification-header h4 { margin: 0; font-size: 15px; color: #1e293b; }
.notification-clear-btn { background: transparent; border: none; color: #64748b; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.notification-list { max-height: 350px; overflow-y: auto; padding: 0; }

/* নতুন (Unread) - হাইলাইট */
.notification-item.unread { background: #eff6ff; border-left: 4px solid #3b82f6; }
.notification-item { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; display: flex; gap: 10px; align-items: center; transition: background 0.2s; }
.notification-item:hover { background: #f8fafc; }

/* পড়া হয়ে গেছে (Read) - হাইলাইট মুছে যাবে */
.notification-item.read { background: #ffffff; border-left: 4px solid transparent; opacity: 0.7; }
.notification-item:last-child { border-bottom: none; }
.notification-icon { width: 36px; height: 36px; border-radius: 50%; background: #eff6ff; color: #1c5fa8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.notification-content { flex: 1; min-width: 0; }
.notification-title { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 2px; }
.notification-sub { font-size: 12px; color: #64748b; }
.notification-datetime { font-size: 11px; color: #94a3b8; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
.empty-notification { padding: 30px; text-align: center; color: #64748b; font-size: 13px; }
.notification-read-btn { background: transparent; border: none; cursor: pointer; color: #94a3b8; padding: 6px; border-radius: 50%; flex-shrink: 0; transition: all 0.2s; }
.notification-read-btn:hover { background: #dcfce7; color: #22c55e; }
.notification-read-btn.marked { background: #dcfce7; color: #22c55e; }
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

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('notif_read_ids') || '[]');
    } catch (e) {
      return [];
    }
  });

  // 🔥 latest readIds ট্র্যাক করার জন্য Ref
  const readIdsRef = useRef(readIds);
  
  // 🔥 readIds পরিবর্তন হলে সাথে সাথে Ref আপডেট হবে
  useEffect(() => {
    readIdsRef.current = readIds;
  }, [readIds]);
  
  const isFirstLoad = useRef(true);

  // প্রতি ৩০ সেকেন্ডে টাইম আপডেট
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!canView) return;

    // ব্রাউজার পারমিশন চাওয়া
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Firebase রিয়েল-টাইম লিসেনার
    const q = query(collection(db, 'appointments'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newItems = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          
          // সঠিক টাইমস্ট্যাম্প পার্সিং
          let date = new Date();
          if (data.timestamp) {
            if (typeof data.timestamp === 'object' && data.timestamp.seconds) {
              date = new Date(data.timestamp.seconds * 1000);
            } else {
              date = new Date(data.timestamp);
            }
          }
          
          const notifObj = {
            id: change.doc.id,
            name: data.name || 'অজানা রোগী',
            doctor: data.doctorName || 'অজানা ডাক্তার',
            time: date
          };
          newItems.push(notifObj);

          // 🔥 ব্রাউজার নোটিফিকেশন পাঠানোর আগে চেক করা হচ্ছে:
          // ১. প্রথম লোড নয় (নাহলে পুরনো ডেটার জন্য নোটিফিকেশন আসবে)
          // ২. পারমিশন দেওয়া আছে
          // ৩. এই আইডিটি readIds তে নেই (অর্থাৎ ড্যাশবোর্ডে দেখা হয়নি)
          if (
            !isFirstLoad.current && 
            "Notification" in window && 
            Notification.permission === "granted" &&
            !readIdsRef.current.includes(change.doc.id)
          ) {
            new Notification("নতুন সিরিয়াল বুকিং!", {
              body: `${data.name || 'রোগী'} - ${data.doctorName || 'ডাক্তার'}`,
              icon: "/logo.png"
            });
          }
        }
      });

      if (!isFirstLoad.current) {
        if (newItems.length > 0) {
          setNotifications((prev) => [...newItems, ...prev].slice(0, 10));
        }
      } else {
        setNotifications(newItems);
        isFirstLoad.current = false;
      }
    });

    return () => unsubscribe();
  }, [canView]);

  useEffect(() => {
    const unread = notifications.filter(n => !readIds.includes(n.id)).length;
    setUnreadCount(unread);
  }, [notifications, readIds]);

  const handleMarkAsRead = (id) => {
    const newReadIds = readIds.includes(id) ? readIds : [...readIds, id];
    setReadIds(newReadIds);
    localStorage.setItem('notif_read_ids', JSON.stringify(newReadIds));
  };

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem('notif_read_ids', JSON.stringify(allIds));
  };

  if (!canView) return null;

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
            <button className="notification-clear-btn" onClick={handleMarkAllRead}>
              <CheckCheck size={14} /> সব পড়া হয়েছে
            </button>
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-notification">কোনো নতুন নোটিফিকেশন নেই</div>
            ) : (
              notifications.map((notif, index) => {
                const isRead = readIds.includes(notif.id);
                return (
                  <div key={notif.id || index} className={`notification-item ${isRead ? 'read' : 'unread'}`}>
                    <div className="notification-icon"><Stethoscope size={18} /></div>
                    <div className="notification-content">
                      <div className="notification-title">{notif.name}</div>
                      <div className="notification-sub">ডাক্তার: {notif.doctor}</div>
                      <div className="notification-datetime">🕒 {timeAgo(notif.time)}</div>
                    </div>
                    
                    <button 
                      className={`notification-read-btn ${isRead ? 'marked' : ''}`} 
                      onClick={() => handleMarkAsRead(notif.id)}
                      title={isRead ? 'পড়া হয়েছে' : 'পড়া হয়েছে হিসেবে চিহ্নিত করুন'}
                    >
                      <Check size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}