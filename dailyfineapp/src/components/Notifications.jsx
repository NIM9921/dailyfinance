import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faBell,
  faExclamationTriangle,
  faCheckCircle,
  faInfoCircle,
  faTrash,
  faCheck,
  faCalendarAlt,
  faWallet,
  faChartLine,
  faCog,
  faFilter,
  faRotateRight
} from '@fortawesome/free-solid-svg-icons';

const BASE_URL = 'http://localhost:5000';

const Notifications = ({ onBackToLanding }) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState(() => localStorage.getItem('selectedCurrency') || '$'); // lazy init from storage
  const [error, setError] = useState('');
  const [isUpdatingRead, setIsUpdatingRead] = useState(false);
  const [readError, setReadError] = useState('');

  const getUserId = () => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const u = JSON.parse(storedUserData);
        return u.id || u._id || u.data?.id || null;
      } catch {
        return null;
      }
    }
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || null;
      } catch {
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // ADDED: react to settings updates
  useEffect(() => {
    const handler = (e) => {
      const cur = e.detail?.currency || localStorage.getItem('selectedCurrency') || '$'; // changed fallback
      setCurrency(cur);
    };
    window.addEventListener('app:settings-updated', handler);
    return () => window.removeEventListener('app:settings-updated', handler);
  }, []);

  const normalizeBackendNotification = (n) => ({
    id: n.id || n._id || n.notificationId || Math.random().toString(36).slice(2),
    type: n.type || 'system',
    title: n.title || 'Notification',
    message: n.message || '',
    amount: n.amount,
    budgetAmount: n.budgetAmount,
    category: n.category,
    timestamp: n.timestamp || n.createdAt || new Date().toISOString(),
    read: typeof n.read === 'boolean' ? n.read : false,
    priority: n.priority || 'low'
  });

  const sampleFallback = () => [
    {
      id: 'fallback-1',
      type: 'system',
      title: 'Sample Notification',
      message: 'Fallback data loaded (server unavailable).',
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'low'
    }
  ];

  const loadNotifications = async () => {
    setIsLoading(true);
    setError('');
    const userId = getUserId();
    if (!userId) {
      setError('User not found. Please log in again.');
      setNotifications(sampleFallback());
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/notifications?userId=${encodeURIComponent(userId)}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || 'Failed to load notifications');
        setNotifications(sampleFallback());
      } else {
        const data = await res.json();
        const list = Array.isArray(data.data) ? data.data.map(normalizeBackendNotification) : [];
        setNotifications(list);
        if (list.length === 0) {
          setError('No notifications found.');
        }
      }
    } catch (e) {
      console.error('Notifications fetch error:', e);
      setError('Unable to connect to server.');
      setNotifications(sampleFallback());
    } finally {
      setIsLoading(false);
    }
  };

  const doFetch = async (url, options, rollback) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const status = res.status;
        let body;
        try { body = await res.json(); } catch { body = {}; }
        console.warn('Read-status API non-OK:', status, body);

        if ([401, 403].includes(status) && options.headers?.Authorization) {
          const retryHeaders = { ...options.headers };
          delete retryHeaders.Authorization;
          const retryRes = await fetch(url, { ...options, headers: retryHeaders });
          if (retryRes.ok) return true;
        }

        if (options.method === 'PATCH') {
          const putRes = await fetch(url, { ...options, method: 'PUT' });
          if (putRes.ok) return true;
        }

        if (rollback) rollback();
        return false;
      }
      return true;
    } catch (err) {
      console.error('Read-status request error:', err);
      if (rollback) rollback();
      return false;
    }
  };

  const sendMarkReadRequest = async (id) => {
    const body = JSON.stringify({ read: true });
    return await doFetch(
      `${BASE_URL}/api/notifications/${id}/read`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body
      }
    );
  };

  const sendMarkAllReadRequest = async (userId) => {
    const body = JSON.stringify({ userId });
    return await doFetch(
      `${BASE_URL}/api/notifications/mark-all-read`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body
      }
    );
  };

  const markAsRead = async (id) => {
    setReadError('');
    let rolledBack = false;
    const prev = notifications;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    const ok = await sendMarkReadRequest(id);
    if (!ok) {
      rolledBack = true;
      setNotifications(prev);
      setReadError('Failed to update read status (single).');
    }
    if (!rolledBack) {
      setReadError('');
    }
  };

  const markAllAsRead = async () => {
    if (isUpdatingRead) return;
    setReadError('');
    const userId = getUserId();
    if (!userId) {
      setReadError('User not found for mark-all-read.');
      return;
    }
    setIsUpdatingRead(true);
    const prev = notifications;
    setNotifications(prev.map(n => ({ ...n, read: true })));

    const ok = await sendMarkAllReadRequest(userId);
    if (!ok) {
      setNotifications(prev);
      setReadError('Failed to update all read statuses.');
    }
    setIsUpdatingRead(false);
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const filteredNotifications = (() => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'budget':
        return notifications.filter(n =>
          ['budget_warning', 'budget_exceeded', 'budget_reminder'].includes(n.type)
        );
      case 'transactions':
        return notifications.filter(n => n.type === 'transaction_added');
      case 'system':
        return notifications.filter(n => n.type === 'system');
      default:
        return notifications;
    }
  })();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'budget_warning':
        return { icon: faExclamationTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'budget_exceeded':
        return { icon: faExclamationTriangle, color: 'text-red-600', bg: 'bg-red-100' };
      case 'transaction_added':
        return { icon: faWallet, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'budget_reminder':
        return { icon: faChartLine, color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'system':
      default:
        return { icon: faInfoCircle, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.abs(now - then);

    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const days = Math.floor(diff / 1000 / 60 / 60 / 24);

    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (hours < 1) return `${minutes} minutes ago`;
    if (hours === 1) return '1 hour ago';
    if (days < 1) return `${hours} hours ago`;
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const formatCurrency = (amount) => {
    const num = typeof amount === 'number' ? amount : Number(amount);
    if (isNaN(num)) return `${currency}0.00`;
    return `${currency}${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-violet-100">
      {/* Header (RESPONSIVE REPLACED) */}
      <div className="bg-white shadow-sm border-b border-violet-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 md:py-0 md:h-16">
            
            {/* Left: Back + Title */}
            <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
              <button
                onClick={onBackToLanding}
                className="inline-flex items-center px-3 py-2 text-violet-600 hover:text-violet-700 hover:bg-violet-100 rounded-lg transition duration-200 text-sm sm:text-base shrink-0"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden xs:inline">Back to Dashboard</span>
                <span className="xs:hidden">Back</span>
              </button>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-violet-900 truncate">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-red-100 text-red-800 shrink-0">
                    {unreadCount} unread
                  </span>
                )}
              </h1>
            </div>

            {/* Actions: scrollable on narrow screens */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1 sm:pb-0">
              <button
                onClick={loadNotifications}
                disabled={isLoading}
                className="shrink-0 inline-flex items-center px-3 py-1.5 text-xs sm:text-sm bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg border border-violet-200 transition disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faRotateRight} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={isUpdatingRead}
                  className="shrink-0 text-xs sm:text-sm text-violet-600 hover:text-violet-700 font-medium disabled:opacity-50 px-2 py-1"
                >
                  {isUpdatingRead ? 'Marking…' : 'Mark all'}
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="shrink-0 text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium px-2 py-1"
                >
                  Clear
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <div className="relative">
              <nav
                className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
                role="tablist"
                aria-label="Notification filters"
              >
                {[
                  { key: 'all',          label: 'All',          icon: faBell },
                  { key: 'unread',       label: 'Unread',       icon: faInfoCircle },
                  { key: 'budget',       label: 'Budget',       icon: faChartLine },
                  { key: 'transactions', label: 'Transactions', icon: faWallet },
                  { key: 'system',       label: 'System',       icon: faCog }
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilter(tab.key)}
                    className={`snap-start shrink-0 flex-1 md:flex-auto min-w-[120px] md:min-w-0 py-3 md:py-4 px-5 md:px-6 text-center font-medium text-xs sm:text-sm md:text-base transition duration-200 ${
                      filter === tab.key
                        ? 'border-b-2 border-violet-500 text-violet-600 bg-violet-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    role="tab"
                    aria-selected={filter === tab.key}
                  >
                    <FontAwesomeIcon icon={tab.icon} className="mr-2 hidden xs:inline" />
                    <span>{tab.label}</span>
                    {tab.key === 'unread' && unreadCount > 0 && (
                      <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-red-100 text-red-800">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Error Banner(s) */}
        {error && !isLoading && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {readError && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg px-4 py-3 text-sm">
            {readError}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            <p className="mt-2 text-violet-600">Loading notifications...</p>
          </div>
        )}

        {/* Notifications List */}
        {!isLoading && (
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <FontAwesomeIcon icon={faBell} className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-500">
                  {filter === 'all' ? 
                    "You're all caught up! No notifications to show." :
                    `No ${filter} notifications to display.`
                  }
                </p>
              </div>
            ) : (
              filteredNotifications.map(notification => {
                const iconConfig = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`bg-white rounded-xl shadow-lg border-l-4 ${
                      notification.priority === 'high'
                        ? 'border-red-500'
                        : notification.priority === 'medium'
                        ? 'border-yellow-500'
                        : 'border-gray-300'
                    } ${!notification.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${iconConfig.bg} flex items-center justify-center`}>
                          <FontAwesomeIcon icon={iconConfig.icon} className={`h-5 w-5 ${iconConfig.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className={`text-lg font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                                {!notification.read && (
                                  <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                                )}
                              </h3>
                              <p className="text-gray-600 mt-1">{notification.message}</p>
                              
                              {/* Amount Display */}
                              {notification.amount && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Amount:</span>
                                    <span className={`font-semibold ${
                                      notification.type === 'transaction_added' && notification.category === 'Salary' 
                                        ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {formatCurrency(notification.amount)}
                                    </span>
                                  </div>
                                  {notification.budgetAmount && (
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-sm text-gray-600">Budget:</span>
                                      <span className="font-medium text-gray-700">
                                        {formatCurrency(notification.budgetAmount)}
                                      </span>
                                    </div>
                                  )}
                                  {notification.category && (
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-sm text-gray-600">Category:</span>
                                      <span className="text-sm font-medium text-gray-700">
                                        {notification.category}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Timestamp */}
                              <div className="flex items-center mt-3 text-sm text-gray-500">
                                <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 mr-1" />
                                {formatTimeAgo(notification.timestamp)}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2 ml-4">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  disabled={isUpdatingRead}
                                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition duration-200 disabled:opacity-50"
                                  title="Mark as read"
                                >
                                  <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                                title="Delete notification"
                              >
                                <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Quick Stats */}
        {!isLoading && notifications.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{notifications.length}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
                <div className="text-sm text-gray-500">Unread</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {notifications.filter(n => n.type === 'budget_exceeded').length}
                </div>
                <div className="text-sm text-gray-500">Budget Alerts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.type === 'transaction_added').length}
                </div>
                <div className="text-sm text-gray-500">Transactions</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;