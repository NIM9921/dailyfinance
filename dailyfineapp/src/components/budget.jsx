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
import { useState, useEffect } from 'react';

// REPLACE previous computeEndDateForPeriod helper with the new duration-based version.
const computeEndDateForPeriod = (period, startISO) => {
  if (!startISO) return '';
  const addDays = (iso, days) => {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };
  switch (period) {
    case 'weekly':
      return addDays(startISO, 6);      // 7-day window
    case 'monthly':
      return addDays(startISO, 30);     // 31 calendar days span (start + 30)
    case 'yearly':
      return addDays(startISO, 365);    // 366 calendar days span (start + 365)
    default:
      return startISO;
  }
};

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
  const [overlapModal, setOverlapModal] = useState({ open: false, budget: null, amount: null, period: null });
  
  // Filter state
  const [periodFilter, setPeriodFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [currency, setCurrency] = useState(() => localStorage.getItem('selectedCurrency') || '$'); // lazy init

  // Get user data and fetch budgets on component mount
  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    const storedToken = localStorage.getItem('authToken');
    
    console.log('Raw stored user data:', storedUserData);
    console.log('Stored token:', storedToken);
    
    if (storedUserData) {
      try {
        const user = JSON.parse(storedUserData);
        console.log('Parsed user data:', user);
        setUserData(user);
        
        let userId = null;
        if (user.id) {
          userId = user.id;
        } else if (user.data && user.data.id) {
          userId = user.data.id;
        } else if (user._id) {
          userId = user._id;
        }
        
        console.log('Extracted user ID:', userId);
        
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
      try {
        const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
        console.log('Token payload:', tokenPayload);
        
        if (tokenPayload.userId) {
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

  useEffect(() => {
    const cur = localStorage.getItem('selectedCurrency') || '$';
    setCurrency(cur);
    const handler = (e) => {
      const c = e.detail?.currency || localStorage.getItem('selectedCurrency') || '$';
      setCurrency(c);
    };
    window.addEventListener('app:settings-updated', handler);
    return () => window.removeEventListener('app:settings-updated', handler);
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
        setBudgets([]);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
      setError('Unable to connect to server');
      setBudgets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBudgetToBackend = async (budgetData) => {
    setIsLoading(true);
    setError('');

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

    console.log('User data:', userData);
    console.log('Extracted user ID:', userId);

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

    console.log('Request data being sent:', requestData);

    try {
      const response = await fetch('http://localhost:5000/api/budgets', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (response.ok) {
        const newBudget = result.budget || result.data || {
          id: result.id || Date.now(),
          ...requestData
        };
        
        console.log('New budget received:', newBudget);
        
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

    console.log('User data:', userData);
    console.log('Extracted user ID:', userId);

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
        const updatedBudget = result.budget || result.data || {
          ...budgetData,
          ...requestData
        };
        
        console.log('Updated budget received:', updatedBudget);
        
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

  const rangesOverlap = (s1, e1, s2, e2) => {
    if (!s1 || !e1 || !s2 || !e2) return false;
    return new Date(s1) <= new Date(e2) && new Date(s2) <= new Date(e1);
  };

  const applyFilters = () => {
    let result = [...budgets];
    if (periodFilter !== 'all') {
      result = result.filter(b => (b.period || '').toLowerCase() === periodFilter);
    }
    if (dateFilter.start && dateFilter.end) {
      result = result.filter(b =>
        rangesOverlap(b.startDate, b.endDate, dateFilter.start, dateFilter.end)
      );
    }
    setFilteredBudgets(result);
  };

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgets, periodFilter, dateFilter.start, dateFilter.end]);

  const clearFilters = () => {
    setPeriodFilter('all');
    setDateFilter({ start: '', end: '' });
  };

  const findOverlappingBudget = (category, period, startDate, endDate) => {
    return budgets.find(b =>
      b &&
      b.category === category &&
      b.period === period &&
      rangesOverlap(b.startDate, b.endDate, startDate, endDate)
    );
  };

  const confirmOverlapUpdate = async () => {
    if (!overlapModal.budget) return;
    const b = overlapModal.budget;
    const payload = {
      id: b.id || b._id,
      category: b.category,
      budgetAmount: overlapModal.amount,
      period: b.period,
      startDate: b.startDate,
      endDate: b.endDate,
      spentAmount: b.spentAmount ?? 0
    };
    await updateBudgetInBackend(payload);
    setOverlapModal({ open: false, budget: null, amount: null, period: null });
  };

  const cancelOverlapUpdate = () => {
    setOverlapModal({ open: false, budget: null, amount: null, period: null });
  };

  // Date helper functions
  const getISO = (dateObj) => dateObj.toISOString().split('T')[0];
  
  // Budget View Component
  const BudgetView = () => (
    <div className="space-y-6">
      {/* Filters UI */}
      <div className="bg-white p-4 rounded-xl shadow flex flex-col lg:flex-row gap-4 items-start lg:items-end">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Period</label>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 text-sm"
          >
            <option value="all">All</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={dateFilter.start}
            onChange={(e) => setDateFilter(df => ({ ...df, start: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 text-sm"
          />
        </div>
        <div className="flex flex-col">{/* End Date (enabled now) */}
          <label className="text-xs font-medium text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            value={dateFilter.end}
            onChange={(e) => setDateFilter(df => ({ ...df, end: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={applyFilters}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={clearFilters}
            disabled={periodFilter === 'all' && !dateFilter.start && !dateFilter.end}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 transition"
          >
            Clear
          </button>
        </div>
        <div className="ml-auto text-sm text-gray-500 font-medium">
          Showing {filteredBudgets.length} / {budgets.length}
        </div>
      </div>

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

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faWallet} className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-gray-500 text-sm">Total Budget (Filtered)</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(filteredBudgets.reduce((sum, b) => sum + (b.budgetAmount || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faChartPie} className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-gray-500 text-sm">Total Spent (Filtered)</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(filteredBudgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCheckCircle} className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-gray-500 text-sm">Remaining (Filtered)</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(filteredBudgets.reduce((sum, b) => sum + ((b.budgetAmount || 0) - (b.spentAmount || 0)), 0))}
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
        {filteredBudgets.length === 0 && !isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <FontAwesomeIcon icon={faWallet} className="h-12 w-12 mb-4 mx-auto" />
            <p>No budgets match current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredBudgets.map((budget) => {
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
                        {formatCurrency(budget.spentAmount || 0)} of {formatCurrency(budget.budgetAmount || 0)}
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

  // Budget Add Component
  const BudgetAdd = () => {
    const todayISO = getISO(new Date());
    const [formData, setFormData] = useState({
      category: '',
      budgetAmount: '',
      period: 'monthly',
      startDate: todayISO,
      endDate: computeEndDateForPeriod('monthly', todayISO), // now monthly = start + 30 days
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
      if (!validateForm()) return;

      const overlapping = findOverlappingBudget(
        formData.category,
        formData.period,
        formData.startDate,
        formData.endDate
      );

      if (overlapping) {
        setOverlapModal({
          open: true,
          budget: overlapping,
          amount: formData.budgetAmount,
          period: overlapping.period
        });
        return;
      }

      setIsSubmitting(true);
      const result = await saveBudgetToBackend(formData);
      if (!result.success && !showErrorModal) {
        setFormErrors({ submit: result.error || 'Failed to save budget' });
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
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    period: e.target.value
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="weekly">Weekly (7 days)</option>
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
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      startDate: newStart,
                      endDate: computeEndDateForPeriod(prev.period, newStart) // ONLY when user changes start date
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed pointer-events-none focus:ring-0 focus:border-gray-300"
                  aria-disabled="true"
                  tabIndex={-1}
                />
                {/*
                  If you still need endDate to submit via form serialization,
                  add a hidden input (uncomment below):
                  <input type="hidden" name="endDate" value={formData.endDate || ''} />
                */}
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

      console.log('User data at edit submit:', userData);
      console.log('Extracted user ID at edit submit:', userId);

      if (!userId) {
        setModalMessage('User data not available. Please refresh the page and try again.');
        setShowErrorModal(true);
        return;
      }

      setIsSubmitting(true);
      
      const result = await updateBudgetInBackend(formData);
      
      if (!result.success && !showErrorModal) {
        setFormErrors({ submit: result.error });
      }
      setIsSubmitting(false);
    };

    return selectedBudget && (
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
                  value={formData.startDate || ''}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      startDate: newStart,
                      endDate: computeEndDateForPeriod(prev.period, newStart) // auto adjust only on start change
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed pointer-events-none focus:ring-0 focus:border-gray-300"
                  aria-disabled="true"
                  tabIndex={-1}
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
            Are you sure you want to delete the budget for &quot;{budgetToDelete?.category}&quot;? This action cannot be undone.
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

  const formatCurrency = (v) => `${currency}${Number(v || 0).toFixed(2)}`;

  return (
    <>
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
        </main>
      </div>

      {/* All Modals rendered outside main layout */}
      <DeleteModal />
      <SuccessModal />
      <ErrorModal />
      
      {/* Overlapping Budget Modal */}
      {overlapModal.open && overlapModal.budget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-lg mx-4 rounded-xl shadow-2xl border border-violet-200 bg-gradient-to-br from-white to-violet-50">
            <div className="px-6 py-5 border-b border-violet-100 flex items-center">
              <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center mr-4">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold text-violet-900">
                Overlapping Budget Detected
              </h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-violet-800 leading-relaxed">
                A budget already exists for:
              </p>
              <div className="rounded-lg bg-white border border-violet-100 p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-violet-500">Category:</span>
                  <span className="font-medium text-violet-800">{overlapModal.budget.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-500">Period:</span>
                  <span className="font-medium text-violet-800 capitalize">{overlapModal.budget.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-500">Existing Range:</span>
                  <span className="font-medium text-violet-800">
                    {overlapModal.budget.startDate} → {overlapModal.budget.endDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-500">Current Amount:</span>
                  <span className="font-medium text-violet-800">
                    {overlapModal.budget.budgetAmount}
                  </span>
                </div>
              </div>
              <p className="text-sm text-violet-900">
                Do you want to update its amount to
                <span className="font-semibold text-violet-600"> {overlapModal.amount}</span>?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={confirmOverlapUpdate}
                  className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium shadow-sm transition"
                >
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  Yes, Update
                </button>
                <button
                  onClick={cancelOverlapUpdate}
                  className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition"
                >
                  <FontAwesomeIcon icon={faTimes} className="mr-2" />
                  Cancel
                </button>
              </div>
              <p className="text-xs text-violet-500 text-center pt-1">
                The original date range will be retained.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Budget;