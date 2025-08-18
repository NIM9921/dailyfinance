import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faEye, faEyeSlash, faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import Register from './register';

const Login = ({ onLoginSuccess }) => {
  const [showRegister, setShowRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

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
    const loginData = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    };

    try {
      console.log('Sending login data to backend:', JSON.stringify(loginData, null, 2));
      
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });

      const result = await response.json();

      if (response.ok) {
        // Store authentication token if provided
        if (result.token) {
          localStorage.setItem('authToken', result.token);
        }
        
        // Store user data if provided
        if (result.user) {
          localStorage.setItem('userData', JSON.stringify(result.user));
        }
        
        // Reset form
        setFormData({
          email: '',
          password: ''
        });
        
        // Show success message
        alert('Login successful! Welcome back.');
        
        // Redirect to landing page
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        
        console.log('User authenticated successfully:', result);
        
      } else {
        // Handle server errors
        if (result.errors) {
          // If server returns validation errors
          setErrors(result.errors);
        } else if (result.message) {
          alert(`Login failed: ${result.message}`);
        } else {
          alert('Invalid email or password. Please try again.');
        }
      }

    } catch (error) {
      console.error('Login error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert('Unable to connect to server. Please check if the backend is running on http://localhost:5000');
      } else {
        alert('Login failed. Please check your internet connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowRegister = () => {
    setShowRegister(true);
  };

  const handleBackToLogin = () => {
    setShowRegister(false);
  };

  // If register component should be shown, render it instead
  if (showRegister) {
    return <Register onBackToLogin={handleBackToLogin} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-violet-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-20 w-20 bg-violet-600 rounded-full flex items-center justify-center mb-6">
            <FontAwesomeIcon icon={faSignInAlt} className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-violet-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-violet-600">
            Welcome back to Daily Finance Management
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
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
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none rounded-lg relative block w-full pl-10 pr-3 py-3 border ${
                    errors.email ? 'border-red-500' : 'border-violet-300'
                  } placeholder-violet-400 text-violet-900 focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm bg-white`}
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
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
                  autoComplete="current-password"
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
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-violet-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-violet-700">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-violet-600 hover:text-violet-500 transition duration-200">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                isLoading 
                  ? 'bg-violet-400 cursor-not-allowed' 
                  : 'bg-violet-600 hover:bg-violet-700 hover:scale-105'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition duration-200 ease-in-out transform`}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <FontAwesomeIcon 
                  icon={faSignInAlt} 
                  className={`h-5 w-5 ${isLoading ? 'text-violet-300' : 'text-violet-500 group-hover:text-violet-400'}`} 
                />
              </span>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-violet-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={handleShowRegister}
                className="font-medium text-violet-600 hover:text-violet-500 underline transition duration-200"
              >
                Create one now
              </button>
            </p>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-violet-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-violet-50 text-violet-500">Or continue with</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;