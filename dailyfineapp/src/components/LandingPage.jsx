import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faSignOutAlt, 
  faDashboard, 
  faWallet, 
  faChartLine, 
  faCog,
  faBars,
  faTimes,
  faBell
} from '@fortawesome/free-solid-svg-icons';
import Transaction from './transaction';
import Budget from './budget';
import Report from './Report';
import Settings from './Settings';
import Notifications from './Notifications';

const LandingPage = ({ onLogout }) => {
  const [userData, setUserData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [activeTransactionTab, setActiveTransactionTab] = useState('income');
  const [currency, setCurrency] = useState(() => localStorage.getItem('selectedCurrency') || '$'); // changed: lazy init from storage

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }

    const cur = localStorage.getItem('selectedCurrency') || '$';
    setCurrency(cur);
    const h = (e) => setCurrency(e.detail?.currency || localStorage.getItem('selectedCurrency') || '$');
    window.addEventListener('app:settings-updated', h);
    return () => window.removeEventListener('app:settings-updated', h);
  }, []);

  const handleLogout = () => {
    // Clear stored data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Call parent logout function
    onLogout();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigateToTransactions = (tabType = null) => {
    setCurrentPage('transactions');
    setActiveTransactionTab(tabType);
  };

  const handleNavigateToBudget = () => {
    setCurrentPage('budget');
  };

  const handleNavigateToReports = () => {
    setCurrentPage('reports');
  };

  const handleNavigateToSettings = () => {
    setCurrentPage('settings');
  };

  const handleNavigateToNotifications = () => {
    setCurrentPage('notifications');
  };

  const handleBackToLanding = () => {
    setCurrentPage('dashboard');
    setActiveTransactionTab(null); // Reset to no tab selected
  };

  // If transaction page should be shown, render it instead
  if (currentPage === 'transactions') {
    return <Transaction onBackToLanding={handleBackToLanding} initialTab={activeTransactionTab} />;
  }

  // If budget page should be shown, render it instead
  if (currentPage === 'budget') {
    return <Budget onBackToLanding={handleBackToLanding} />;
  }

  // If reports page should be shown, render it instead
  if (currentPage === 'reports') {
    return <Report onBackToLanding={handleBackToLanding} />;
  }

  // If settings page should be shown, render it instead
  if (currentPage === 'settings') {
    return <Settings onBackToLanding={handleBackToLanding} />;
  }

  // If notifications page should be shown, render it instead
  if (currentPage === 'notifications') {
    return <Notifications onBackToLanding={handleBackToLanding} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-violet-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-violet-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo and Title */}
            <div className="flex items-center flex-shrink-0">
              <div className="h-10 w-10 md:h-14 md:w-14 bg-violet-600 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faWallet} className="h-5 w-5 md:h-8 md:w-8 text-white" />
              </div>
              <h1 className="ml-2 md:ml-4 text-lg md:text-2xl font-bold text-violet-900 truncate">
                <span className="hidden sm:inline">Daily Finance Management</span>
                <span className="sm:hidden">Finance App</span>
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              {/* Notification Bell */}
              <button
                onClick={handleNavigateToNotifications}
                className="relative p-2 text-violet-600 hover:text-violet-700 hover:bg-violet-100 rounded-lg transition duration-200"
              >
                <FontAwesomeIcon icon={faBell} className="h-6 w-6" />
                {/* Notification Badge */}
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  3
                </span>
              </button>

              <div className="flex items-center space-x-2 lg:space-x-3">
                <FontAwesomeIcon icon={faUser} className="h-5 w-5 lg:h-6 lg:w-6 text-violet-600" />
                <span className="text-violet-700 font-medium text-sm lg:text-lg max-w-32 lg:max-w-none truncate">
                  {userData?.name || 'Welcome'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 lg:px-6 lg:py-3 border border-transparent text-sm lg:text-base leading-4 font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition duration-200"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
                <span className="hidden lg:inline">Logout</span>
                <span className="lg:hidden">Exit</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-violet-600 hover:text-violet-700 hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500"
              >
                <FontAwesomeIcon 
                  icon={isMobileMenuOpen ? faTimes : faBars} 
                  className="h-6 w-6" 
                />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-violet-200 bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button
                  onClick={handleNavigateToNotifications}
                  className="w-full flex items-center px-3 py-2 text-base font-medium text-violet-700 hover:bg-violet-100 rounded-md transition duration-200"
                >
                  <FontAwesomeIcon icon={faBell} className="h-5 w-5 mr-3" />
                  Notifications
                  <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    3
                  </span>
                </button>
                <div className="flex items-center px-3 py-2 text-violet-700">
                  <FontAwesomeIcon icon={faUser} className="h-5 w-5 mr-3 text-violet-600" />
                  <span className="font-medium truncate">
                    {userData?.name || 'Welcome User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-base font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md transition duration-200"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 md:py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-6 md:mb-8">
          <div className="bg-white overflow-hidden shadow-lg rounded-xl">
            <div className="px-4 py-6 sm:px-6 md:px-8 lg:px-10 sm:py-8 md:py-8 lg:py-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-violet-900 mb-2 md:mb-4">
                Welcome back, {userData?.name?.split(' ')[0] || 'User'}! 👋
              </h2>
              <p className="text-violet-600 text-base md:text-lg">
                Ready to manage your finances today? Here's your dashboard overview.
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-6 md:mb-10">
          {/* Total Balance Card */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300">
            <div className="p-4 md:p-6 lg:p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faWallet} className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-green-600" />
                </div>
                <div className="ml-4 md:ml-6 w-0 flex-1">
                  <dl>
                    <dt className="text-sm md:text-base font-medium text-gray-500 truncate">
                      Total Balance
                    </dt>
                    <dd className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                      {currency}12,345.67
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Income Card */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300">
            <div className="p-4 md:p-6 lg:p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-blue-600" />
                </div>
                <div className="ml-4 md:ml-6 w-0 flex-1">
                  <dl>
                    <dt className="text-sm md:text-base font-medium text-gray-500 truncate">
                      Monthly Income
                    </dt>
                    <dd className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                      {currency}5,420.00
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Expenses Card */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300">
            <div className="p-4 md:p-6 lg:p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-red-600" />
                </div>
                <div className="ml-4 md:ml-6 w-0 flex-1">
                  <dl>
                    <dt className="text-sm md:text-base font-medium text-gray-500 truncate">
                      Monthly Expenses
                    </dt>
                    <dd className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                      {currency}2,840.35
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Card */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300">
            <div className="p-4 md:p-6 lg:p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faWallet} className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-purple-600" />
                </div>
                <div className="ml-4 md:ml-6 w-0 flex-1">
                  <dl>
                    <dt className="text-sm md:text-base font-medium text-gray-500 truncate">
                      Savings Goal
                    </dt>
                    <dd className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                      75% Complete
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-lg rounded-xl">
          <div className="px-4 py-6 sm:px-6 md:px-8 lg:px-10 sm:py-8 md:py-8 lg:py-10">
            <h3 className="text-xl md:text-2xl leading-6 font-bold text-gray-900 mb-6 md:mb-8">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <button className="bg-violet-50 hover:bg-violet-100 p-4 md:p-6 lg:p-8 rounded-xl border border-violet-200 transition duration-200 transform hover:scale-105">
                <FontAwesomeIcon icon={faDashboard} className="h-8 w-8 md:h-10 md:w-10 text-violet-600 mb-3 md:mb-4" />
                <div className="text-base md:text-lg font-semibold text-violet-900">View Dashboard</div>
              </button>
              
              <button 
                onClick={() => handleNavigateToTransactions('income')}
                className="bg-green-50 hover:bg-green-100 p-4 md:p-6 lg:p-8 rounded-xl border border-green-200 transition duration-200 transform hover:scale-105"
              >
                <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 md:h-10 md:w-10 text-green-600 mb-3 md:mb-4" />
                <div className="text-base md:text-lg font-semibold text-green-900">Add Income</div>
              </button>
              
              <button 
                onClick={() => handleNavigateToTransactions('expense')}
                className="bg-red-50 hover:bg-red-100 p-4 md:p-6 lg:p-8 rounded-xl border border-red-200 transition duration-200 transform hover:scale-105"
              >
                <FontAwesomeIcon icon={faWallet} className="h-8 w-8 md:h-10 md:w-10 text-red-600 mb-3 md:mb-4" />
                <div className="text-base md:text-lg font-semibold text-red-900">Add Expense</div>
              </button>
              
              <button 
                onClick={handleNavigateToReports}
                className="bg-blue-50 hover:bg-blue-100 p-4 md:p-6 lg:p-8 rounded-xl border border-blue-200 transition duration-200 transform hover:scale-105"
              >
                <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 md:h-10 md:w-10 text-blue-600 mb-3 md:mb-4" />
                <div className="text-base md:text-lg font-semibold text-blue-900">View Reports</div>
              </button>
              
              <button 
                onClick={handleNavigateToBudget}
                className="bg-yellow-50 hover:bg-yellow-100 p-4 md:p-6 lg:p-8 rounded-xl border border-yellow-200 transition duration-200 transform hover:scale-105"
              >
                <FontAwesomeIcon icon={faWallet} className="h-8 w-8 md:h-10 md:w-10 text-yellow-600 mb-3 md:mb-4" />
                <div className="text-base md:text-lg font-semibold text-yellow-900">Set Budget</div>
              </button>
              
              <button 
                onClick={handleNavigateToSettings}
                className="bg-gray-50 hover:bg-gray-100 p-4 md:p-6 lg:p-8 rounded-xl border border-gray-200 transition duration-200 transform hover:scale-105"
              >
                <FontAwesomeIcon icon={faCog} className="h-8 w-8 md:h-10 md:w-10 text-gray-600 mb-3 md:mb-4" />
                <div className="text-base md:text-lg font-semibold text-gray-900">Settings</div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
