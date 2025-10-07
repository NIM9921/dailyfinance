import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faDollarSign,
  faCalendarAlt,
  faTag,
  faStickyNote,
  faChartLine,
  faWallet,
  faSave,
  faTrash,
  faList,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

const Transaction = ({ onBackToLanding, initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'income');
  const [formData, setFormData] = useState({
    title: activeTab === 'income' ? 'Income' : 'Expenses',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [currency, setCurrency] = useState(() => localStorage.getItem('selectedCurrency') || '$'); // lazy init from storage
  const [isFetching, setIsFetching] = useState(false);
  const [listType, setListType] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [fetchedTransactions, setFetchedTransactions] = useState([]);
  const [fetchMessage, setFetchMessage] = useState('');
  const [showAllTxModal, setShowAllTxModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      title: activeTab === 'income' ? 'Income' : 'Expenses',
      category: ''
    }));
  }, [activeTab]);

  // ADDED: global settings update listener
  useEffect(() => {
    const onSettings = (e) => {
      const cur = e.detail?.currency || localStorage.getItem('selectedCurrency') || '$'; // changed fallback
      setCurrency(cur);
    };
    window.addEventListener('app:settings-updated', onSettings);
    return () => window.removeEventListener('app:settings-updated', onSettings);
  }, []);

  const incomeCategories = [
    'Salary',
    'Freelance',
    'Business',
    'Investment',
    'Rental',
    'Gift',
    'Bonus',
    'Other Income'
  ];

  const expenseCategories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Insurance',
    'Other Expenses'
  ];

  const getCurrentCategories = () => {
    return activeTab === 'income' ? incomeCategories : expenseCategories;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAmountInput = (e) => {
    let v = e.target.value;
    // Remove invalid chars
    v = v.replace(/[^0-9.]/g, '');
    // Keep only first dot
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v.slice(firstDot + 1).replace(/\./g, '');
      v = before + after;
    }
    // Limit to 2 decimals
    if (v.includes('.')) {
      const [intPart, decPart] = v.split('.');
      v = intPart + '.' + decPart.slice(0, 2);
    }
    setFormData(prev => ({ ...prev, amount: v }));
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Please select a category';
    }
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    const transactionData = {
      title: formData.title,
      type: activeTab,
      amount: parseFloat(formData.amount),
      category: formData.category.trim(),
      date: formData.date,
      description: formData.description.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      console.log('Sending transaction data:', JSON.stringify(transactionData, null, 2));

      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(transactionData)
      });

      const result = await response.json();

      if (response.ok) {
        if (activeTab === 'expense') {
          // CHANGED: pass transaction date
            await updateBudgetSpentAmount(
              getUserId(),
              transactionData.category,
              transactionData.amount,
              transactionData.date
            );
        }

        alert(`${formData.title} added successfully!`);
        setTransactions(prev => [result.transaction || transactionData, ...prev]);
        setFormData({
          title: activeTab === 'income' ? 'Income' : 'Expenses',
          amount: '',
          category: '',
          date: new Date().toISOString().split('T')[0],
          description: ''
        });
      } else {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          alert(`Failed to add ${formData.title.toLowerCase()}: ${result.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Transaction submission error:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert('Unable to connect to server. Please check if the backend is running.');
      } else {
        alert('Failed to save transaction. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // NEW helper: check if a date is within inclusive ISO date range
  const dateInRange = (iso, startISO, endISO) => {
    if (!iso || !startISO || !endISO) return false;
    const d = new Date(iso);
    return d >= new Date(startISO) && d <= new Date(endISO);
  };

  // REPLACED previous single-budget updater with multi-budget logic
  const updateBudgetSpentAmount = async (userId, category, expenseAmount, txDateISO) => {
    try {
      const budgetsResponse = await fetch(`http://localhost:5000/api/budgets/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!budgetsResponse.ok) {
        console.error('Failed to fetch budgets for update');
        return;
      }

      const budgetsData = await budgetsResponse.json();
      const budgetsList = budgetsData.budgets || [];

      // Match category (allow mapping "Other Expenses" -> "Other")
      const normalizedCategory = category === 'Other Expenses' ? 'Other' : category;

      // All budgets for same category AND transaction date inside their range
      const applicableBudgets = budgetsList.filter(b =>
        (b.category === normalizedCategory) &&
        dateInRange(txDateISO, b.startDate, b.endDate)
      );

      if (applicableBudgets.length === 0) {
        console.log(`No active budgets found for category: ${category} on ${txDateISO}`);
        return;
      }

      const alertMessages = [];

      // Update each applicable budget
      for (const b of applicableBudgets) {
        const updatedSpentAmount = (b.spentAmount || 0) + expenseAmount;

        const updateData = {
          userId,
            category: b.category,
            budgetAmount: b.budgetAmount,
            period: b.period,
            startDate: b.startDate,
            endDate: b.endDate,
            spentAmount: updatedSpentAmount
        };

        const putRes = await fetch(`http://localhost:5000/api/budgets/${b.id || b._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify(updateData)
        });

        if (!putRes.ok) {
          console.error(`Failed to update budget (${b.category}, ${b.period})`);
          continue;
        }

        const pct = (updatedSpentAmount / b.budgetAmount) * 100;
        if (pct >= 100) {
          alertMessages.push(
            `Over Budget: ${b.category} (${b.period})\nSpent: ${currency}${updatedSpentAmount.toFixed(2)} / ${currency}${b.budgetAmount.toFixed(2)} (${pct.toFixed(1)}%)`
          );
        } else if (pct >= 80) {
          alertMessages.push(
            `Warning: ${b.category} (${b.period}) ${pct.toFixed(1)}% used\nSpent: ${currency}${updatedSpentAmount.toFixed(2)} / ${currency}${b.budgetAmount.toFixed(2)}`
          );
        }
      }

      if (alertMessages.length > 0) {
        // Single aggregated alert
        alert(alertMessages.join('\n\n'));
      }
    } catch (error) {
      console.error('Error updating multiple budgets:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrors({});
  };

  const formatAmount = (amount) => {
    const num = typeof amount === 'number' ? amount : Number(amount);
    return isNaN(num) ? `${currency}0.00` : `${currency}${num.toFixed(2)}`;
  };

  const getUserId = () => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const user = JSON.parse(storedUserData);
      return user.id || user.data?.id || user._id || null;
    }
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      try {
        const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
        return tokenPayload.userId || null;
      } catch {
        return null;
      }
    }
    return null;
  };

  const fetchUserTransactions = async (type = null) => {
    const userId = getUserId();
    if (!userId) {
      alert('User not found. Please log in again.');
      return;
    }

    setIsFetching(true);
    setFetchMessage('');
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/test/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await res.json();

      // Normalize possible shapes (fix: handle data.data array)
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.data)) {
        list = data.data; // NEW: handle { success, count, ..., data: [...] }
      } else if (Array.isArray(data.transactions)) {
        list = data.transactions;
      } else if (Array.isArray(data.data?.transactions)) {
        list = data.data.transactions;
      } else if (data._id) {
        list = [data];
      }

      // Filter if type provided
      if (type && type !== 'all') {
        list = list.filter(t => (t.type || '').toLowerCase() === type);
      }

      setListType(type || 'all');
      setFetchedTransactions(list);

      if (!list || list.length === 0) {
        setFetchMessage('No transactions found for the selected filter.');
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setFetchMessage('Failed to fetch transactions. Please try again.');
      setFetchedTransactions([]);
    } finally {
      setIsFetching(false);
    }
  };

  const openDetails = (tx) => {
    setSelectedTx(tx);
    setShowDetailsModal(true);
  };
  const closeDetails = () => {
    setSelectedTx(null);
    setShowDetailsModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-violet-100">
      <header className="bg-white shadow-sm border-b border-violet-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <button
              onClick={onBackToLanding}
              className="flex items-center text-violet-600 hover:text-violet-700 transition duration-200"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-5 w-5 mr-2" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-violet-900">
              Manage Transactions
            </h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 md:py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => handleTabChange('income')}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm md:text-base transition duration-200 ${
                  activeTab === 'income'
                    ? 'border-b-2 border-green-500 text-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 mr-2" />
                Add Income
              </button>
              <button
                onClick={() => handleTabChange('expense')}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm md:text-base transition duration-200 ${
                  activeTab === 'expense'
                    ? 'border-b-2 border-red-500 text-red-600 bg-red-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FontAwesomeIcon icon={faWallet} className="h-5 w-5 mr-2" />
                Add Expense
              </button>
            </nav>
          </div>

          <div className="p-6 md:p-8">
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* All */}
              <button
                type="button"
                onClick={() => { setShowAllTxModal(true); fetchUserTransactions('all'); }}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                disabled={isFetching}
              >
                <FontAwesomeIcon icon={faList} className="mr-2" />
                {isFetching && listType === 'all' ? 'Loading...' : 'View All Transactions'}
              </button>
              {/* Income -> open income modal */}
              <button
                type="button"
                onClick={() => { setShowIncomeModal(true); fetchUserTransactions('income'); }}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition"
                disabled={isFetching}
              >
                <FontAwesomeIcon icon={faList} className="mr-2" />
                {isFetching && listType === 'income' ? 'Loading...' : 'View All Income'}
              </button>
              {/* Expense -> open expense modal */}
              <button
                type="button"
                onClick={() => { setShowExpenseModal(true); fetchUserTransactions('expense'); }}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition"
                disabled={isFetching}
              >
                <FontAwesomeIcon icon={faList} className="mr-2" />
                {isFetching && listType === 'expense' ? 'Loading...' : 'View All Expenses'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type
                </label>
                <div className="relative">
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    readOnly
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:outline-none ${
                      activeTab === 'income' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <FontAwesomeIcon
                      icon={activeTab === 'income' ? faChartLine : faWallet}
                      className={`h-5 w-5 ${activeTab === 'income' ? 'text-green-500' : 'text-red-500'}`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-semibold">{currency}</span>
                    </span>
                    <input
                      id="amount"
                      name="amount"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={formData.amount}
                      onChange={handleAmountInput}
                      className={`w-full pl-9 pr-4 py-3 border ${
                        errors.amount ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border ${
                        errors.date ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500`}
                    />
                  </div>
                  {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faTag} className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500`}
                  >
                    <option value="">Select a category</option>
                    {getCurrentCategories().map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FontAwesomeIcon icon={faStickyNote} className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    placeholder="Add any notes or details..."
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex-1 flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : activeTab === 'income'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-200`}
                >
                  <FontAwesomeIcon icon={faSave} className="h-5 w-5 mr-2" />
                  {isLoading ? 'Saving...' : `Save ${formData.title}`}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      title: activeTab === 'income' ? 'Income' : 'Expenses',
                      amount: '',
                      category: '',
                      date: new Date().toISOString().split('T')[0],
                      description: ''
                    })
                  }
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-200"
                >
                  <FontAwesomeIcon icon={faTrash} className="h-5 w-5 mr-2" />
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* All Transactions Modal (unchanged) */}
        {showAllTxModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">All Transactions</h3>
                <button
                  onClick={() => setShowAllTxModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>

              {/* Loader */}
              {isFetching && (
                <div className="py-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                  <p className="mt-2 text-violet-600">Loading...</p>
                </div>
              )}

              {/* Empty / Error */}
              {!isFetching && fetchMessage && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-600 text-center">
                  {fetchMessage}
                </div>
              )}

              {/* Table */}
              {!isFetching && fetchedTransactions.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fetchedTransactions.map((tx) => {
                        const typeIsIncome = (tx.type || '').toLowerCase() === 'income';
                        const categoryName =
                          typeof tx.category === 'object' && tx.category?.name
                            ? tx.category.name
                            : (tx.category || 'Uncategorized');
                        return (
                          <tr key={tx._id || `${tx.type}-${tx.createdAt || Math.random()}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {tx.date ? new Date(tx.date).toLocaleDateString() : ''}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{categoryName}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeIsIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {typeIsIncome ? 'Income' : 'Expense'}
                              </span>
                            </td>
                            <td className={`px-4 py-3 text-sm text-right font-semibold ${typeIsIncome ? 'text-green-600' : 'text-red-600'}`}>
                              {typeIsIncome ? '+' : '-'}{formatAmount(Number(tx.amount) || 0)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => openDetails(tx)}
                                className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
                              >
                                <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NEW: Income Transactions Modal */}
        {showIncomeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-800">All Income Transactions</h3>
                <button
                  onClick={() => setShowIncomeModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>

              {isFetching && (
                <div className="py-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                  <p className="mt-2 text-violet-600">Loading income...</p>
                </div>
              )}

              {!isFetching && fetchMessage && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-600 text-center">
                  {fetchMessage}
                </div>
              )}

              {!isFetching && fetchedTransactions.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fetchedTransactions.map(tx => {
                        const categoryName = typeof tx.category === 'object' && tx.category?.name ? tx.category.name : (tx.category || 'Uncategorized');
                        return (
                          <tr key={tx._id || `${tx.type}-${tx.createdAt || Math.random()}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-700">{tx.date ? new Date(tx.date).toLocaleDateString() : ''}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{categoryName}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                              +{formatAmount(Number(tx.amount) || 0)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => openDetails(tx)}
                                className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
                              >
                                <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NEW: Expense Transactions Modal */}
        {showExpenseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-800">All Expense Transactions</h3>
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>

              {isFetching && (
                <div className="py-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                  <p className="mt-2 text-violet-600">Loading expenses...</p>
                </div>
              )}

              {!isFetching && fetchMessage && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-600 text-center">
                  {fetchMessage}
                </div>
              )}

              {!isFetching && fetchedTransactions.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fetchedTransactions.map(tx => {
                        const categoryName = typeof tx.category === 'object' && tx.category?.name ? tx.category.name : (tx.category || 'Uncategorized');
                        return (
                          <tr key={tx._id || `${tx.type}-${tx.createdAt || Math.random()}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-700">{tx.date ? new Date(tx.date).toLocaleDateString() : ''}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{categoryName}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                              -{formatAmount(Number(tx.amount) || 0)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => openDetails(tx)}
                                className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
                              >
                                <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Details Modal (unchanged) */}
        {showDetailsModal && selectedTx && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
              <div className="flex items-center mb-4">
                <FontAwesomeIcon
                  icon={selectedTx.type === 'income' ? faChartLine : faWallet}
                  className={`h-6 w-6 mr-3 ${selectedTx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                />
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedTx.title || (selectedTx.type === 'income' ? 'Income' : 'Expense')} Details
                </h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className={`${selectedTx.type === 'income' ? 'text-green-600' : 'text-red-600'} font-semibold`}>
                    {formatAmount(selectedTx.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Category</span>
                  <span className="text-gray-800">
                    {typeof selectedTx.category === 'object' && selectedTx.category?.name
                      ? selectedTx.category.name
                      : (selectedTx.category || 'Uncategorized')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-800">
                    {selectedTx.date ? new Date(selectedTx.date).toLocaleString() : ''}
                  </span>
                </div>
                {selectedTx.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Method</span>
                    <span className="text-gray-800">{selectedTx.paymentMethod}</span>
                  </div>
                )}
                {selectedTx.description && (
                  <div>
                    <span className="text-gray-500">Description</span>
                    <p className="text-gray-800 mt-1">{selectedTx.description}</p>
                  </div>
                )}
                {selectedTx.user?.name && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">User</span>
                    <span className="text-gray-800">{selectedTx.user.name}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeDetails}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Transaction;