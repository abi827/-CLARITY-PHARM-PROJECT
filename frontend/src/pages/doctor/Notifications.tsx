import React, { useEffect, useState } from 'react';
import { doctorAPI } from '../../services/api';
import { Bell, BellOff, CheckCheck, AlertCircle, FileText, MessageSquare, CheckCircle, Info, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type Notification = {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  prescription_id: string | null;
  clarification_id: string | null;
  is_read: boolean;
  created_at: string | null;
};

const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string; text: string; border: string }> = {
  clarification_requested: { icon: MessageSquare, bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
  clarification_request:   { icon: MessageSquare, bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
  clarification_resolved:  { icon: CheckCircle,   bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100' },
  resolved:                { icon: CheckCircle,   bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100' },
  prescription_approved:   { icon: CheckCircle,   bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100' },
  prescription_updated:    { icon: FileText,       bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100' },
  response_received:       { icon: FileText,       bg: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-teal-100' },
  default:                 { icon: Info,           bg: 'bg-gray-50',   text: 'text-gray-500',   border: 'border-gray-100' },
};

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = () => {
    setLoading(true);
    doctorAPI.listNotifications()
      .then(res => setNotifications(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id: number) => {
    try {
      await doctorAPI.markNotifRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await doctorAPI.markAllNotifsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    } finally {
      setMarkingAll(false);
    }
  };

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0
              ? <><span className="text-teal-600 font-semibold">{unreadCount} unread</span> — stay up to date with your prescription activity.</>
              : 'All caught up! No unread notifications.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Filter tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'unread' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Unread ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4 p-5 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-48" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
            <BellOff className="w-7 h-7 text-gray-300" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-sm text-gray-400">
              {filter === 'unread'
                ? 'You\'re all caught up! Switch to "All" to see past notifications.'
                : 'Notifications will appear here when pharmacists request clarifications or updates occur.'}
            </p>
          </div>
          {filter === 'unread' && (
            <button
              onClick={() => setFilter('all')}
              className="text-sm text-teal-600 hover:underline font-medium"
            >
              View all notifications
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {displayed.map(n => {
            const key = (n.notification_type || '').toLowerCase();
            const cfg = TYPE_CONFIG[key] || TYPE_CONFIG.default;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                className={`flex gap-4 p-5 transition-colors ${!n.is_read ? 'bg-teal-50/30 hover:bg-teal-50/50' : 'hover:bg-gray-50'}`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.border}`}>
                  <Icon className={`w-4 h-4 ${cfg.text}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {!n.is_read && (
                        <span className="inline-block w-2 h-2 bg-teal-500 rounded-full mr-2 mb-0.5 align-middle" />
                      )}
                      {n.title}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0 mt-0.5">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-2.5">
                    {n.prescription_id && (
                      <span className="text-xs text-gray-400 font-mono">Rx: {n.prescription_id}</span>
                    )}
                    {n.clarification_id && (
                      <span className="text-xs text-gray-400 font-mono">Clar: {n.clarification_id}</span>
                    )}
                    {n.clarification_id && (
                      <Link
                        to="/doctor/clarification-requests"
                        className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-semibold hover:underline"
                      >
                        <span>Respond to Clarification</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                    {!n.clarification_id && n.prescription_id && (
                      <Link
                        to="/doctor/resolved"
                        className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-semibold hover:underline"
                      >
                        <span>View in Prescriptions</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                    {!n.is_read && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline ml-auto"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
