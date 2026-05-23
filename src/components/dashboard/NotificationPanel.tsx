import React from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, CheckCheck } from 'lucide-react';
import type { Notification } from '../../services/bankingApi';
import { markNotificationRead, markAllNotificationsRead } from '../../services/bankingApi';

interface Props {
  notifications: Notification[];
  onUpdate: (updated: Notification[]) => void;
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const typeIcon: Record<string, React.ReactNode> = {
  WARNING: <AlertTriangle size={16} className="text-amber-500" />,
  INFO: <Info size={16} className="text-blue-500" />,
  SUCCESS: <CheckCircle size={16} className="text-green-500" />,
};

export const NotificationPanel: React.FC<Props> = ({ notifications, onUpdate }) => {
  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      onUpdate(notifications.map((n) => n.notificationId === id ? { ...n, read: true } : n));
    } catch {
      // silent — optimistic already applied
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      onUpdate(notifications.map((n) => ({ ...n, read: true })));
    } catch {
      // silent
    }
  };

  const unread = notifications.filter((n) => !n.read);

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Bell size={16} className="text-lloyds-green" /> Notifications
        </h3>
        <div className="text-center py-6">
          <Bell size={28} className="text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No notifications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Bell size={16} className="text-lloyds-green" />
          Notifications
          {unread.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unread.length}
            </span>
          )}
        </h3>
        {unread.length > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1 text-xs text-lloyds-green hover:underline"
          >
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {notifications.map((n) => (
          <div
            key={n.notificationId}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
              n.read ? 'bg-gray-50 border-gray-100' : 'bg-blue-50 border-blue-100'
            }`}
          >
            <div className="mt-0.5">{typeIcon[n.type] ?? <Info size={16} className="text-gray-400" />}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{n.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
              <p className="text-[10px] text-gray-400 mt-1">{formatTimestamp(n.timestamp)}</p>
            </div>
            {!n.read && (
              <button
                onClick={() => handleMarkRead(n.notificationId)}
                className="text-[10px] text-lloyds-green hover:underline shrink-0 mt-1"
              >
                Dismiss
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
