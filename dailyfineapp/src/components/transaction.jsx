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
  faTrash
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
  const [currency, setCurrency] = useState('₹');

  useEffect(() => {
    // Load saved currency preference
    const savedCurrency = localStorage.getItem('selectedCurrency') || '₹';
    setCurrency(savedCurrency);
    
    setFormData(prev => ({
      ...prev,
      title: activeTab === 'income' ? 'Income' : 'Expenses',
      category: ''
    }));
  }, [activeTab]);

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

      // Get user data for budget update
      const storedUserData = localStorage.getItem('userData');
      const storedToken = localStorage.getItem('authToken');
      let userId = null;

      if (storedUserData) {
        const user = JSON.parse(storedUserData);
        userId = user.id || user.data?.id || user._id;
      } else if (storedToken) {
        try {
          const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
          userId = tokenPayload.userId;
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }

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
        // If this is an expense transaction, update the related budget
        if (activeTab === 'expense' && userId) {
          await updateBudgetSpentAmount(userId, transactionData.category, transactionData.amount);
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

  // Function to update budget spent amount
  const updateBudgetSpentAmount = async (userId, category, expenseAmount) => {
    try {
      // First, get all budgets for the user
      const budgetsResponse = await fetch(`http://localhost:5000/api/budgets/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (budgetsResponse.ok) {
        const budgetsData = await budgetsResponse.json();
        const budgets = budgetsData.budgets || [];

        // Find budget that matches the expense category
        const matchingBudget = budgets.find(budget => 
          budget.category === category || 
          (category === 'Other Expenses' && budget.category === 'Other')
        );

        if (matchingBudget) {
          // Update the spent amount
          const updatedSpentAmount = (matchingBudget.spentAmount || 0) + expenseAmount;

          const updateData = {
            userId: userId,
            category: matchingBudget.category,
            budgetAmount: matchingBudget.budgetAmount,
            period: matchingBudget.period,
            startDate: matchingBudget.startDate,
            endDate: matchingBudget.endDate,
            spentAmount: updatedSpentAmount
          };

          const updateResponse = await fetch(`http://localhost:5000/api/budgets/${matchingBudget.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(updateData)
          });

          if (updateResponse.ok) {
            console.log(`Budget updated successfully for category: ${category}`);
            
            // Check if budget is exceeded and show warning with correct currency
            const percentage = (updatedSpentAmount / matchingBudget.budgetAmount) * 100;
            if (percentage >= 100) {
              alert(`⚠️ Budget Alert: You have exceeded your budget for ${category}! 
Spent: ${currency}${updatedSpentAmount.toFixed(2)} / Budget: ${currency}${matchingBudget.budgetAmount.toFixed(2)}`);
            } else if (percentage >= 80) {
              alert(`⚠️ Budget Warning: You have used ${percentage.toFixed(1)}% of your budget for ${category}. 
Spent: ${currency}${updatedSpentAmount.toFixed(2)} / Budget: ${currency}${matchingBudget.budgetAmount.toFixed(2)}`);
            }
          } else {
            console.error('Failed to update budget spent amount');
          }
        } else {
          console.log(`No budget found for category: ${category}`);
        }
      }
    } catch (error) {
      console.error('Error updating budget spent amount:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrors({});
  };

  const formatAmount = (amount) => {
    const num = typeof amount === 'number' ? amount : Number(amount);
    return isNaN(num) ? '0.00' : `${currency}${num.toFixed(2)}`;
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
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faDollarSign} className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border ${
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

        {transactions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      ></div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.category}</p>
                        <p className="text-sm text-gray-500">{transaction.date}</p>
                      </div>
                    </div>
                    <p
                      className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}${formatAmount(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Transaction;