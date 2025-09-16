import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faPlus,
  faEdit,
  faTrash,
  faSave,
  faTimes,
  faWallet,
  faChartPie,
  faExclamationTriangle,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

const Budget = ({ onBackToLanding }) => {
  const [currentView, setCurrentView] = useState('view');
  const [budgets, setBudgets] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Get user data and fetch budgets on component mount
  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    const storedToken = localStorage.getItem('authToken');
    
    console.log('Raw stored user data:', storedUserData); // Debug log
    console.log('Stored token:', storedToken); // Debug log
    
    if (storedUserData) {
      try {
        const user = JSON.parse(storedUserData);
        console.log('Parsed user data:', user); // Debug log
        setUserData(user);
        
        // Handle different possible user data structures
        let userId = null;
        if (user.id) {
          userId = user.id;
        } else if (user.data && user.data.id) {
          userId = user.data.id;
        } else if (user._id) {
          userId = user._id;
        }
        
        console.log('Extracted user ID:', userId); // Debug log
        
        if (userId) {
          fetchUserBudgets(userId);
        } else {
          setError('Unable to extract user ID from stored data');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setError('Invalid user data format');
      }
    } else if (storedToken) {
      // If we have a token but no user data, try to decode the token
      try {
        const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
        console.log('Token payload:', tokenPayload); // Debug log
        
        if (tokenPayload.userId) {
          // Create a temporary user object from token
          const tempUser = { id: tokenPayload.userId };
          setUserData(tempUser);
          fetchUserBudgets(tokenPayload.userId);
        } else {
          setError('Invalid token format');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setError('Unable to decode authentication token');
      }
    } else {
      console.log('No user data or token found in localStorage');
      setError('No user data found. Please log in again.');
    }
  }, []);

  // API Functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchUserBudgets = async (userId) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:5000/api/budgets/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setBudgets(data.budgets || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch budgets');
        // Fallback to sample data if API fails
        setBudgets([]);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
      setError('Unable to connect to server');
      // Fallback to sample data
      setBudgets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBudgetToBackend = async (budgetData) => {
    setIsLoading(true);
    setError('');

    // Enhanced user data validation with multiple possible structures
    let userId = null;
    if (userData) {
      if (userData.id) {
        userId = userData.id;
      } else if (userData.data && userData.data.id) {
        userId = userData.data.id;
      } else if (userData._id) {
        userId = userData._id;
      }
    }

    // If no userId from userData, try to get it from token
    if (!userId) {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        try {
          const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
          userId = tokenPayload.userId;
        } catch (error) {
          console.error('Error decoding token for userId:', error);
        }
      }
    }

    console.log('User data:', userData); // Debug log
    console.log('Extracted user ID:', userId); // Debug log

    if (!userId) {
      setError('User data not available. Please log in again.');
      setIsLoading(false);
      return { success: false, error: 'User data not available' };
    }

    const requestData = {
      userId: userId,
      category: budgetData.category,
      budgetAmount: parseFloat(budgetData.budgetAmount),
      period: budgetData.period,
      startDate: budgetData.startDate,
      endDate: budgetData.endDate,
      spentAmount: budgetData.spentAmount || 0
    };

    console.log('Request data being sent:', requestData); // Debug log

    try {
      const response = await fetch('http://localhost:5000/api/budgets', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (response.ok) {
        // Ensure the budget data has the expected structure
        const newBudget = result.budget || result.data || {
          id: result.id || Date.now(),
          ...requestData
        };
        
        console.log('New budget received:', newBudget); // Debug log
        
        // Add the new budget to local state
        setBudgets(prevBudgets => [...prevBudgets, newBudget]);
        setModalMessage('Budget created successfully!');
        setShowSuccessModal(true);
        return { success: true };
      } else {
        setModalMessage(result.message || 'Failed to save budget');
        setShowErrorModal(true);
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      setModalMessage('Unable to connect to server. Please check your connection and try again.');
      setShowErrorModal(true);
      return { success: false, error: 'Network error' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateBudgetInBackend = async (budgetData) => {
    setIsLoading(true);
    setError('');

    // Enhanced user data validation with multiple possible structures
    let userId = null;
    if (userData) {
      if (userData.id) {
        userId = userData.id;
      } else if (userData.data && userData.data.id) {
        userId = userData.data.id;
      } else if (userData._id) {
        userId = userData._id;
      }
    }

    // If no userId from userData, try to get it from token
    if (!userId) {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        try {
          const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
          userId = tokenPayload.userId;
        } catch (error) {
          console.error('Error decoding token for userId:', error);
        }
      }
    }

    console.log('User data:', userData); // Debug log
    console.log('Extracted user ID:', userId); // Debug log

    if (!userId) {
      setError('User data not available. Please log in again.');
      setIsLoading(false);
      return { success: false, error: 'User data not available' };
    }

    const requestData = {
      userId: userId,
      category: budgetData.category,
      budgetAmount: parseFloat(budgetData.budgetAmount),
      period: budgetData.period,
      startDate: budgetData.startDate,
      endDate: budgetData.endDate,
      spentAmount: budgetData.spentAmount
    };

    try {
      const response = await fetch(`http://localhost:5000/api/budgets/${budgetData.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (response.ok) {
        // Ensure the budget data has the expected structure
        const updatedBudget = result.budget || result.data || {
          ...budgetData,
          ...requestData
        };
        
        console.log('Updated budget received:', updatedBudget); // Debug log
        
        // Update the budget in local state
        setBudgets(budgets.map(b => 
          b.id === budgetData.id ? updatedBudget : b
        ));
        setModalMessage('Budget updated successfully!');
        setShowSuccessModal(true);
        return { success: true };
      } else {
        setModalMessage(result.message || 'Failed to update budget');
        setShowErrorModal(true);
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      setModalMessage('Unable to connect to server. Please check your connection and try again.');
      setShowErrorModal(true);
      return { success: false, error: 'Network error' };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBudgetFromBackend = async (budgetId) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/budgets/${budgetId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        // Remove budget from local state
        setBudgets(budgets.filter(b => b.id !== budgetId));
        setShowDeleteModal(false);
        setBudgetToDelete(null);
        return { success: true };
      } else {
        const result = await response.json();
        setError(result.message || 'Failed to delete budget');
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      setError('Unable to connect to server');
      return { success: false, error: 'Network error' };
    } finally {
      setIsLoading(false);
    }
  };

  const getBudgetStatus = (budget) => {
    const percentage = (budget.spentAmount / budget.budgetAmount) * 100;
    if (percentage >= 100) return { status: 'over', color: 'red', text: 'Over Budget' };
    if (percentage >= 80) return { status: 'warning', color: 'yellow', text: 'Near Limit' };
    return { status: 'good', color: 'green', text: 'On Track' };
  };

  const handleEditBudget = (budget) => {
    setSelectedBudget(budget);
    setCurrentView('edit');
  };

  const handleDeleteClick = (budget) => {
    setBudgetToDelete(budget);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    await deleteBudgetFromBackend(budgetToDelete.id);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setModalMessage('');
    setCurrentView('view');
    setSelectedBudget(null);
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setModalMessage('');
    setCurrentView('view');
    setSelectedBudget(null);
  };

  // Budget View Component
  const BudgetView = () => (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
          <p className="mt-2 text-violet-600">Loading budgets...</p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl md:text-3xl font-bold text-violet-900">Budget Overview</h2>
        <button
          onClick={() => setCurrentView('add')}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition duration-200"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Add Budget
        </button>
      </div>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faWallet} className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-gray-500 text-sm">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">
                ${budgets.reduce((sum, b) => sum + b.budgetAmount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faChartPie} className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-gray-500 text-sm">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ${budgets.reduce((sum, b) => sum + b.spentAmount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCheckCircle} className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-gray-500 text-sm">Remaining</p>
              <p className="text-2xl font-bold text-gray-900">
                ${budgets.reduce((sum, b) => sum + (b.budgetAmount - b.spentAmount), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-violet-50 border-b border-violet-100">
          <h3 className="text-lg font-semibold text-violet-900">Budget Categories</h3>
        </div>
        {budgets.length === 0 && !isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <FontAwesomeIcon icon={faWallet} className="h-12 w-12 mb-4 mx-auto" />
            <p>No budgets found. Create your first budget to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {budgets.map((budget) => {
              // Add null checks for budget properties
              if (!budget || !budget.budgetAmount) {
                console.warn('Invalid budget data:', budget);
                return null;
              }

              const status = getBudgetStatus(budget);
              const percentage = Math.min((budget.spentAmount / budget.budgetAmount) * 100, 100);
              
              return (
                <div key={budget.id || budget._id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{budget.category || 'Unknown Category'}</h4>
                      <p className="text-sm text-gray-500">{budget.period || 'monthly'} budget</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditBudget(budget)}
                        className="p-2 text-violet-600 hover:bg-violet-100 rounded-lg transition duration-200"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(budget)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition duration-200"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        ${budget.spentAmount || 0} of ${budget.budgetAmount || 0}
                      </span>
                      <span className={`font-medium text-${status.color}-600`}>
                        {status.text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          status.status === 'over' ? 'bg-red-500' :
                          status.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        )}
      </div>
    </div>
  );

  // Predefined budget categories
  const budgetCategories = [
    'Food & Dining',
    'Transportation',
    'Entertainment',
    'Shopping',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Groceries',
    'Insurance',
    'Investment',
    'Savings',
    'Personal Care',
    'Home & Garden',
    'Pets',
    'Gifts & Donations',
    'Other'
  ];
 
  // Currency options
  const currencyOptions = [
    { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
    { symbol: '$', code: 'USD', name: 'US Dollar' },
    { symbol: '€', code: 'EUR', name: 'Euro' },
    { symbol: '£', code: 'GBP', name: 'British Pound' },
    { symbol: 'Rs', code: 'LKR', name: 'Sri Lankan Rupee' }
  ];

  // Budget Add Component
  const BudgetAdd = () => {
    const [formData, setFormData] = useState({
      category: '',
      budgetAmount: '',
      period: 'monthly',
      startDate: '',
      endDate: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
      const errors = {};
      
      if (!formData.category.trim()) {
        errors.category = 'Category is required';
      }
      
      if (!formData.budgetAmount || parseFloat(formData.budgetAmount) <= 0) {
        errors.budgetAmount = 'Budget amount must be greater than 0';
      }
      
      if (!formData.startDate) {
        errors.startDate = 'Start date is required';
      }
      
      if (!formData.endDate) {
        errors.endDate = 'End date is required';
      }
      
      if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
        errors.endDate = 'End date must be after start date';
      }
      
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }

      // Enhanced user data validation
      let userId = null;
      if (userData) {
        if (userData.id) {
          userId = userData.id;
        } else if (userData.data && userData.data.id) {
          userId = userData.data.id;
        } else if (userData._id) {
          userId = userData._id;
        }
      }

      // If no userId from userData, try to get it from token
      if (!userId) {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          try {
            const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
            userId = tokenPayload.userId;
          } catch (error) {
            console.error('Error decoding token for userId:', error);
          }
        }
      }

      console.log('User data at submit:', userData); // Debug log
      console.log('Extracted user ID at submit:', userId); // Debug log

      if (!userId) {
        setModalMessage('User data not available. Please refresh the page and try again.');
        setShowErrorModal(true);
        return;
      }

      setIsSubmitting(true);
      const result = await saveBudgetToBackend(formData);
      
      if (!result.success && !showErrorModal) {
        // Only show error if modal wasn't already triggered
        setFormErrors({ submit: result.error });
      }
      setIsSubmitting(false);
    };

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-violet-900 mb-6">Add New Budget</h2>
          
          {formErrors.submit && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{formErrors.submit}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500 ${
                  formErrors.category ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select a category</option>
                {budgetCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {formErrors.category && <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget Amount</label>
              <input
                type="number"
                value={formData.budgetAmount}
                onChange={(e) => setFormData({...formData, budgetAmount: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500 ${
                  formErrors.budgetAmount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
              {formErrors.budgetAmount && <p className="mt-1 text-sm text-red-600">{formErrors.budgetAmount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({...formData, period: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-violet-600 text-white py-2 px-4 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition duration-200"
              >
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Budget'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('view')}
                disabled={isSubmitting}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition duration-200"
              >
                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Budget Edit Component
  const BudgetEdit = () => {
    const [formData, setFormData] = useState(selectedBudget || {});
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Enhanced user data validation
      let userId = null;
      if (userData) {
        if (userData.id) {
          userId = userData.id;
        } else if (userData.data && userData.data.id) {
          userId = userData.data.id;
        } else if (userData._id) {
          userId = userData._id;
        }
      }

      // If no userId from userData, try to get it from token
      if (!userId) {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          try {
            const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
            userId = tokenPayload.userId;
          } catch (error) {
            console.error('Error decoding token for userId:', error);
          }
        }
      }

      console.log('User data at edit submit:', userData); // Debug log
      console.log('Extracted user ID at edit submit:', userId); // Debug log

      if (!userId) {
        setModalMessage('User data not available. Please refresh the page and try again.');
        setShowErrorModal(true);
        return;
      }

      setIsSubmitting(true);
      
      const result = await updateBudgetInBackend(formData);
      
      if (!result.success && !showErrorModal) {
        // Only show error if modal wasn't already triggered
        setFormErrors({ submit: result.error });
      }
      setIsSubmitting(false);
    };

    if (!selectedBudget) return null;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-violet-900 mb-6">Edit Budget</h2>
          
          {formErrors.submit && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{formErrors.submit}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                required
              >
                <option value="">Select a category</option>
                {budgetCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget Amount</label>
              <input
                type="number"
                value={formData.budgetAmount}
                onChange={(e) => setFormData({...formData, budgetAmount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({...formData, period: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-violet-600 text-white py-2 px-4 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition duration-200"
              >
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                {isSubmitting ? 'Updating...' : 'Update Budget'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentView('view');
                  setSelectedBudget(null);
                }}
                disabled={isSubmitting}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition duration-200"
              >
                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal
  const DeleteModal = () => (
    showDeleteModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Delete Budget</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete the budget for "{budgetToDelete?.category}"? This action cannot be undone.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={handleDeleteConfirm}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-200"
            >
              Delete
            </button>
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setBudgetToDelete(null);
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  );

  // Success Modal Component
  const SuccessModal = () => (
    showSuccessModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Success</h3>
          </div>
          <p className="text-gray-600 mb-6">
            {modalMessage}
          </p>
          <div className="flex justify-center">
            <button
              onClick={handleSuccessModalClose}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )
  );

  // Error Modal Component
  const ErrorModal = () => (
    showErrorModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Error</h3>
          </div>
          <p className="text-gray-600 mb-6">
            {modalMessage}
          </p>
          <div className="flex justify-center">
            <button
              onClick={handleErrorModalClose}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )
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
            <h1 className="ml-4 text-xl font-bold text-violet-900">Budget Management</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {currentView === 'view' && <BudgetView />}
        {currentView === 'add' && <BudgetAdd />}
        {currentView === 'edit' && <BudgetEdit />}
        <DeleteModal />
        <SuccessModal />
        <ErrorModal />
      </main>
    </div>
  );
};

export default Budget;
