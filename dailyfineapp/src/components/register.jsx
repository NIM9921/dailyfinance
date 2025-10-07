import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faPhone, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const Register = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    telephone: '',
    dateOfBirth: '',
    gender: '',
    country: '',
    designation: '',
    averageMonthlyIncome: '',
    civilStatus: '',
    profileImage: '',
    currency: localStorage.getItem('selectedCurrency') || 'Rs',
    language: 'English',
    theme: 'light',
    budgetAlerts: true,
    emailNotifications: true,
    pushNotifications: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const currencyOptions = ['Rs','₹','$', '€', '£'];
  const languageOptions = ['English','Hindi','Spanish','French','German'];
  const themeOptions = ['light','dark','auto'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      setErrors(prev => ({ ...prev, profileImage: 'Invalid image type' }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profileImage: reader.result }));
      setErrors(prev => ({ ...prev, profileImage: '' }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Telephone number is required';
    } else if (!/^\d{10,}$/.test(formData.telephone.replace(/\D/g, ''))) {
      newErrors.telephone = 'Please enter a valid telephone number';
    }

    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth required';
    if (!formData.gender) newErrors.gender = 'Gender required';
    if (!formData.country.trim()) newErrors.country = 'Country required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation required';
    if (formData.averageMonthlyIncome === '' || Number(formData.averageMonthlyIncome) <= 0)
      newErrors.averageMonthlyIncome = 'Income must be > 0';
    if (!formData.civilStatus) newErrors.civilStatus = 'Civil status required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Prepare data for backend
    const registrationData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      telephone: formData.telephone.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      country: formData.country.trim(),
      designation: formData.designation.trim(),
      averageMonthlyIncome: Number(formData.averageMonthlyIncome),
      civilStatus: formData.civilStatus,
      profileImage: formData.profileImage || '',
      settings: {
        currency: formData.currency,
        language: formData.language,
        theme: formData.theme,
        notifications: {
          budgetAlerts: formData.budgetAlerts,
          emailNotifications: formData.emailNotifications,
          pushNotifications: formData.pushNotifications
        }
      }
    };

    try {
      console.log('Sending registration data to backend:', JSON.stringify(registrationData, null, 2));
      
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Registration successful! You can now log in with your credentials.');
        
        // Reset form
        setFormData({
          name: '', email: '', password: '', confirmPassword: '', telephone: '',
          dateOfBirth: '', gender: '', country: '', designation: '',
          averageMonthlyIncome: '', civilStatus: '', profileImage: '',
          currency: registrationData.settings.currency,
          language: 'English', theme: 'light',
          budgetAlerts: true, emailNotifications: true, pushNotifications: false
        });
        
        // Redirect to login after success
        setTimeout(() => {
          onBackToLogin();
        }, 1000);
      } else {
        // Handle server errors
        if (result.errors) {
          // If server returns validation errors
          setErrors(result.errors);
        } else if (result.message) {
          alert(`Registration failed: ${result.message}`);
        } else {
          alert('Registration failed. Please try again.');
        }
      }

    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert('Unable to connect to server. Please check if the backend is running on http://localhost:5000');
      } else {
        alert('Registration failed. Please check your internet connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-violet-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-violet-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-violet-600">
            Join us to manage your daily finances
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-violet-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-violet-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={`appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border ${
                    errors.name ? 'border-red-500' : 'border-violet-300'
                  } placeholder-violet-400 text-violet-900 focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm bg-white`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-violet-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faEnvelope} className="h-5 w-5 text-violet-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border ${
                    errors.email ? 'border-red-500' : 'border-violet-300'
                  } placeholder-violet-400 text-violet-900 focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm bg-white`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Telephone Field */}
            <div>
              <label htmlFor="telephone" className="block text-sm font-medium text-violet-700 mb-1">
                Telephone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faPhone} className="h-5 w-5 text-violet-400" />
                </div>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={handleChange}
                  className={`appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border ${
                    errors.telephone ? 'border-red-500' : 'border-violet-300'
                  } placeholder-violet-400 text-violet-900 focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm bg-white`}
                  placeholder="Enter your phone number"
                />
              </div>
              {errors.telephone && <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-violet-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="h-5 w-5 text-violet-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none rounded-lg relative block w-full pl-10 pr-10 py-3 border ${
                    errors.password ? 'border-red-500' : 'border-violet-300'
                  } placeholder-violet-400 text-violet-900 focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm bg-white`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <FontAwesomeIcon 
                    icon={showPassword ? faEyeSlash : faEye} 
                    className="h-5 w-5 text-violet-400 hover:text-violet-600" 
                  />
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-violet-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="h-5 w-5 text-violet-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none rounded-lg relative block w-full pl-10 pr-10 py-3 border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-violet-300'
                  } placeholder-violet-400 text-violet-900 focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm bg-white`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <FontAwesomeIcon 
                    icon={showConfirmPassword ? faEyeSlash : faEye} 
                    className="h-5 w-5 text-violet-400 hover:text-violet-600" 
                  />
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            {/* Profile Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-violet-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`w-full rounded-lg px-3 py-2 border ${errors.dateOfBirth ? 'border-red-500' : 'border-violet-300'} focus:ring-violet-500 focus:border-violet-500`}
                />
                {errors.dateOfBirth && <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-violet-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full rounded-lg px-3 py-2 border ${errors.gender ? 'border-red-500' : 'border-violet-300'} focus:ring-violet-500 focus:border-violet-500`}
                >
                  <option value="">Select</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="nonbinary">Non-binary</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_say">Prefer not to say</option>
                </select>
                {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-violet-700 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`w-full rounded-lg px-3 py-2 border ${errors.country ? 'border-red-500' : 'border-violet-300'} focus:ring-violet-500 focus:border-violet-500`}
                  placeholder="Country"
                />
                {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-violet-700 mb-1">Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className={`w-full rounded-lg px-3 py-2 border ${errors.designation ? 'border-red-500' : 'border-violet-300'} focus:ring-violet-500 focus:border-violet-500`}
                  placeholder="Job Title"
                />
                {errors.designation && <p className="mt-1 text-xs text-red-600">{errors.designation}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-violet-700 mb-1">Avg Monthly Income</label>
                <input
                  type="number"
                  name="averageMonthlyIncome"
                  min="0"
                  step="0.01"
                  value={formData.averageMonthlyIncome}
                  onChange={handleChange}
                  className={`w-full rounded-lg px-3 py-2 border ${errors.averageMonthlyIncome ? 'border-red-500' : 'border-violet-300'} focus:ring-violet-500 focus:border-violet-500`}
                  placeholder="0.00"
                />
                {errors.averageMonthlyIncome && <p className="mt-1 text-xs text-red-600">{errors.averageMonthlyIncome}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-violet-700 mb-1">Civil Status</label>
                <select
                  name="civilStatus"
                  value={formData.civilStatus}
                  onChange={handleChange}
                  className={`w-full rounded-lg px-3 py-2 border ${errors.civilStatus ? 'border-red-500' : 'border-violet-300'} focus:ring-violet-500 focus:border-violet-500`}
                >
                  <option value="">Select</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="widowed">Widowed</option>
                  <option value="divorced">Divorced</option>
                  <option value="separated">Separated</option>
                  <option value="other">Other</option>
                </select>
                {errors.civilStatus && <p className="mt-1 text-xs text-red-600">{errors.civilStatus}</p>}
              </div>
            </div>

            {/* Profile Image */}
            <div>
              <label className="block text-sm font-medium text-violet-700 mb-1">Profile Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelected}
                className="w-full text-sm"
              />
              {formData.profileImage && (
                <div className="mt-2">
                  <img
                    src={formData.profileImage}
                    alt="preview"
                    className="h-20 w-20 object-cover rounded-full border"
                  />
                </div>
              )}
              {errors.profileImage && <p className="mt-1 text-xs text-red-600">{errors.profileImage}</p>}
            </div>

            {/* Settings / Preferences */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-semibold text-violet-800">Preferences</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-violet-600 mb-1">Currency</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full rounded-lg px-3 py-2 border border-violet-300 focus:ring-violet-500 focus:border-violet-500 text-sm"
                  >
                    {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-violet-600 mb-1">Language</label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full rounded-lg px-3 py-2 border border-violet-300 focus:ring-violet-500 focus:border-violet-500 text-sm"
                  >
                    {languageOptions.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-violet-600 mb-1">Theme</label>
                  <select
                    name="theme"
                    value={formData.theme}
                    onChange={handleChange}
                    className="w-full rounded-lg px-3 py-2 border border-violet-300 focus:ring-violet-500 focus:border-violet-500 text-sm"
                  >
                    {themeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="inline-flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    name="budgetAlerts"
                    checked={formData.budgetAlerts}
                    onChange={handleChange}
                    className="rounded text-violet-600 focus:ring-violet-500"
                  />
                  <span>Budget Alerts</span>
                </label>
                <label className="inline-flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={formData.emailNotifications}
                    onChange={handleChange}
                    className="rounded text-violet-600 focus:ring-violet-500"
                  />
                  <span>Email Notifications</span>
                </label>
                <label className="inline-flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    name="pushNotifications"
                    checked={formData.pushNotifications}
                    onChange={handleChange}
                    className="rounded text-violet-600 focus:ring-violet-500"
                  />
                  <span>Push Notifications</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium text-white ${
                isLoading ? 'bg-violet-400 cursor-not-allowed'
                        : 'bg-violet-600 hover:bg-violet-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition`}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="font-medium text-violet-600 hover:text-violet-500 transition duration-200"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;