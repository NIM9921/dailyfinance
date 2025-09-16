import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faUser,
  faCog,
  faBell,
  faShieldAlt,
  faEye,
  faEyeSlash,
  faSave,
  faEdit,
  faCamera,
  faPalette,
  faGlobe,
  faLock,
  faTrash,
  faExclamationTriangle,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

const Settings = ({ onBackToLanding }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    telephone: '',
    profileImage: null
  });
  const [settings, setSettings] = useState({
    currency: '₹',
    language: 'English',
    theme: 'light',
    notifications: {
      budgetAlerts: true,
      emailNotifications: true,
      pushNotifications: false
    }
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');

  // Currency options
  const currencyOptions = [
    { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
    { symbol: '$', code: 'USD', name: 'US Dollar' },
    { symbol: '€', code: 'EUR', name: 'Euro' },
    { symbol: '£', code: 'GBP', name: 'British Pound' },
    { symbol: 'Rs', code: 'LKR', name: 'Sri Lankan Rupee' }
  ];

  const languageOptions = [
    'English',
    'Hindi',
    'Spanish',
    'French',
    'German'
  ];

  const themeOptions = [
    { value: 'light', label: 'Light Mode' },
    { value: 'dark', label: 'Dark Mode' },
    { value: 'auto', label: 'Auto (System)' }
  ];

  useEffect(() => {
    loadUserData();
    loadSettings();
  }, []);

  const loadUserData = () => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const user = JSON.parse(storedUserData);
      setUserData({
        name: user.name || '',
        email: user.email || '',
        telephone: user.telephone || '',
        profileImage: user.profileImage || null
      });
    }
  };

  const loadSettings = () => {
    const savedCurrency = localStorage.getItem('selectedCurrency') || '₹';
    const savedSettings = localStorage.getItem('userSettings');
    
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings({
        ...settings,
        currency: savedCurrency,
        ...parsedSettings
      });
    } else {
      setSettings(prev => ({ ...prev, currency: savedCurrency }));
    }
  };

  const handleUserDataChange = (field, value) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSettingsChange = (section, field, value) => {
    if (section) {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setSettings(prev => ({ ...prev, [field]: value }));
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!userData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!userData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!userData.telephone.trim()) {
      newErrors.telephone = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileUpdate = async () => {
    if (!validateProfileForm()) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update localStorage
      localStorage.setItem('userData', JSON.stringify(userData));
      
      setShowSuccessMessage('Profile updated successfully!');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!validatePasswordForm()) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setShowSuccessMessage('Password updated successfully!');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsUpdate = () => {
    // Update localStorage
    localStorage.setItem('selectedCurrency', settings.currency);
    localStorage.setItem('userSettings', JSON.stringify({
      language: settings.language,
      theme: settings.theme,
      notifications: settings.notifications
    }));
    
    setShowSuccessMessage('Settings saved successfully!');
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  const handleAccountDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmAccountDelete = () => {
    // Clear all data and logout
    localStorage.clear();
    setShowDeleteModal(false);
    onBackToLanding();
  };

  const ProfileTab = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center">
            {userData.profileImage ? (
              <img src={userData.profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <FontAwesomeIcon icon={faUser} className="h-8 w-8 text-violet-600" />
            )}
          </div>
          <button className="absolute bottom-0 right-0 bg-violet-600 text-white p-1.5 rounded-full hover:bg-violet-700">
            <FontAwesomeIcon icon={faCamera} className="h-3 w-3" />
          </button>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Profile Picture</h3>
          <p className="text-sm text-gray-500">Click the camera icon to upload a new photo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            value={userData.name}
            onChange={(e) => handleUserDataChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={userData.email}
            onChange={(e) => handleUserDataChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input
            type="tel"
            value={userData.telephone}
            onChange={(e) => handleUserDataChange('telephone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500 ${
              errors.telephone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your phone number"
          />
          {errors.telephone && <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>}
        </div>
      </div>

      <button
        onClick={handleProfileUpdate}
        disabled={isLoading}
        className="w-full md:w-auto px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition duration-200"
      >
        <FontAwesomeIcon icon={faSave} className="mr-2" />
        {isLoading ? 'Updating...' : 'Update Profile'}
      </button>
    </div>
  );

  const PreferencesTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
          <select
            value={settings.currency}
            onChange={(e) => handleSettingsChange(null, 'currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
          >
            {currencyOptions.map((option) => (
              <option key={option.code} value={option.symbol}>
                {option.symbol} {option.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
          <select
            value={settings.language}
            onChange={(e) => handleSettingsChange(null, 'language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
          >
            {languageOptions.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => handleSettingsChange(null, 'theme', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
          >
            {themeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Notifications</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-700">Budget Alerts</h5>
              <p className="text-sm text-gray-500">Get notified when you exceed budget limits</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.budgetAlerts}
                onChange={(e) => handleSettingsChange('notifications', 'budgetAlerts', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-700">Email Notifications</h5>
              <p className="text-sm text-gray-500">Receive updates via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.emailNotifications}
                onChange={(e) => handleSettingsChange('notifications', 'emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-700">Push Notifications</h5>
              <p className="text-sm text-gray-500">Get push notifications on your device</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.pushNotifications}
                onChange={(e) => handleSettingsChange('notifications', 'pushNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>
        </div>
      </div>

      <button
        onClick={handleSettingsUpdate}
        className="w-full md:w-auto px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition duration-200"
      >
        <FontAwesomeIcon icon={faSave} className="mr-2" />
        Save Preferences
      </button>
    </div>
  );

  const SecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Change Password</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-violet-500 focus:border-violet-500 ${
                  errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={showPasswords.current ? faEyeSlash : faEye} />
              </button>
            </div>
            {errors.currentPassword && <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-violet-500 focus:border-violet-500 ${
                  errors.newPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={showPasswords.new ? faEyeSlash : faEye} />
              </button>
            </div>
            {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-violet-500 focus:border-violet-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={showPasswords.confirm ? faEyeSlash : faEye} />
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>

          <button
            onClick={handlePasswordUpdate}
            disabled={isLoading}
            className="w-full md:w-auto px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition duration-200"
          >
            <FontAwesomeIcon icon={faLock} className="mr-2" />
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h4>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-medium text-red-900">Delete Account</h5>
              <p className="text-sm text-red-700 mb-3">
                Once you delete your account, there is no going back. All your data will be permanently removed.
              </p>
              <button
                onClick={handleAccountDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-violet-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-violet-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={onBackToLanding}
              className="inline-flex items-center px-4 py-2 text-violet-600 hover:text-violet-700 hover:bg-violet-100 rounded-lg transition duration-200"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to Dashboard
            </button>
            <h1 className="ml-4 text-xl font-bold text-violet-900">Settings</h1>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-green-600 mr-3" />
              <p className="text-green-700">{showSuccessMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-4 px-6 text-center font-medium transition duration-200 ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-violet-500 text-violet-600 bg-violet-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`flex-1 py-4 px-6 text-center font-medium transition duration-200 ${
                  activeTab === 'preferences'
                    ? 'border-b-2 border-violet-500 text-violet-600 bg-violet-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FontAwesomeIcon icon={faCog} className="mr-2" />
                Preferences
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 py-4 px-6 text-center font-medium transition duration-200 ${
                  activeTab === 'security'
                    ? 'border-b-2 border-violet-500 text-violet-600 bg-violet-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FontAwesomeIcon icon={faShieldAlt} className="mr-2" />
                Security
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'preferences' && <PreferencesTab />}
            {activeTab === 'security' && <SecurityTab />}
          </div>
        </div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={confirmAccountDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-200"
              >
                Yes, Delete Account
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
