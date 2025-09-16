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
  faEllipsisV,
  faCalendarAlt,
  faWallet,
  faChartLine,
  faCog,
  faFilter
} from '@fortawesome/free-solid-svg-icons';

const Notifications = ({ onBackToLanding }) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, budget, transactions, system
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState('₹');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency') || '₹';
    setCurrency(savedCurrency);
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    setIsLoading(true);
    
    // Sample notifications - in real app, fetch from API
    const sampleNotifications = [
      {
        id: 1,
        type: 'budget_warning',
        title: 'Budget Alert: Food & Dining',
        message: 'You have used 85% of your Food & Dining budget for this month.',
        amount: 4250,
        budgetAmount: 5000,
        category: 'Food & Dining',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        read: false,
        priority: 'medium'
      },
      {
        id: 2,
        type: 'budget_exceeded',
        title: 'Budget Exceeded: Transportation',
        message: 'You have exceeded your Transportation budget by ₹500.',
        amount: 2500,
        budgetAmount: 2000,
        category: 'Transportation',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        read: false,
        priority: 'high'
      },
      {
        id: 3,
        type: 'transaction_added',
        title: 'New Income Added',
        message: 'Salary payment of ₹50,000 has been recorded.',
        amount: 50000,
        category: 'Salary',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        read: true,
        priority: 'low'
      },
      {
        id: 4,
        type: 'system',
        title: 'Monthly Report Available',
        message: 'Your monthly financial report for December is now available.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        read: false,
        priority: 'low'
      },
      {
        id: 5,
        type: 'budget_reminder',
        title: 'Budget Reminder',
        message: 'Don\'t forget to set your budget for the next month.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        read: true,
        priority: 'low'
      },
      {
        id: 6,
        type: 'transaction_added',
        title: 'Large Expense Recorded',
        message: 'Shopping expense of ₹8,500 has been added to your account.',
        amount: 8500,
        category: 'Shopping',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        read: true,
        priority: 'medium'
      }
    ];

    // Simulate API call delay
    setTimeout(() => {
      setNotifications(sampleNotifications);
      setIsLoading(false);
    }, 1000);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'budget_warning':
        return { icon: faExclamationTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'budget_exceeded':
        return { icon: faExclamationTriangle, color: 'text-red-600', bg: 'bg-red-100' };
      case 'transaction_added':
        return { icon: faWallet, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'system':
        return { icon: faInfoCircle, color: 'text-gray-600', bg: 'bg-gray-100' };
      case 'budget_reminder':
        return { icon: faChartLine, color: 'text-purple-600', bg: 'bg-purple-100' };
      default:
        return { icon: faBell, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const formatCurrency = (amount) => {
    return `${currency}${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'budget':
        return notifications.filter(n => 
          n.type === 'budget_warning' || 
          n.type === 'budget_exceeded' || 
          n.type === 'budget_reminder'
        );
      case 'transactions':
        return notifications.filter(n => n.type === 'transaction_added');
      case 'system':
        return notifications.filter(n => n.type === 'system');
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-violet-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-violet-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBackToLanding}
                className="inline-flex items-center px-4 py-2 text-violet-600 hover:text-violet-700 hover:bg-violet-100 rounded-lg transition duration-200"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Back to Dashboard
              </button>
              <h1 className="ml-4 text-xl font-bold text-violet-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {unreadCount} unread
                  </span>
                )}
              </h1>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                >
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear all
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
            <nav className="flex">
              {[
                { key: 'all', label: 'All', icon: faBell },
                { key: 'unread', label: 'Unread', icon: faInfoCircle },
                { key: 'budget', label: 'Budget', icon: faChartLine },
                { key: 'transactions', label: 'Transactions', icon: faWallet },
                { key: 'system', label: 'System', icon: faCog }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm md:text-base transition duration-200 ${
                    filter === tab.key
                      ? 'border-b-2 border-violet-500 text-violet-600 bg-violet-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FontAwesomeIcon icon={tab.icon} className="mr-2" />
                  {tab.label}
                  {tab.key === 'unread' && unreadCount > 0 && (
                    <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

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
              filteredNotifications.map((notification) => {
                const iconConfig = getNotificationIcon(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    className={`bg-white rounded-xl shadow-lg border-l-4 ${
                      notification.priority === 'high' ? 'border-red-500' :
                      notification.priority === 'medium' ? 'border-yellow-500' : 'border-gray-300'
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
                                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition duration-200"
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
