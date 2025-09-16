import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faPhone, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const Register = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    telephone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      telephone: formData.telephone.trim()
    };

    try {
      console.log('Sending registration data to backend:', JSON.stringify(registrationData, null, 2));
      
      const response = await fetch('http://localhost:5000/api/register', {
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
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          telephone: ''
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