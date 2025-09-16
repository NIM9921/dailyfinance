import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faChartPie,
  faWallet,
  faExclamationTriangle,
  faCheckCircle,
  faCalendarAlt,
  faDollarSign,
  faChartBar,
  faFileAlt,
  faDownload
} from '@fortawesome/free-solid-svg-icons';

const Report = ({ onBackToLanding }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reportData, setReportData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalBudget: 0,
    totalSpent: 0,
    remainingBudget: 0,
    overBudgetCategories: [],
    warningCategories: []
  });
  const [currency, setCurrency] = useState('₹');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    const storedToken = localStorage.getItem('authToken');
    const savedCurrency = localStorage.getItem('selectedCurrency') || '₹';
    setCurrency(savedCurrency);

    if (storedUserData) {
      const user = JSON.parse(storedUserData);
      setUserData(user);
      fetchReportData(user.id || user.data?.id || user._id);
    } else if (storedToken) {
      try {
        const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
        if (tokenPayload.userId) {
          const tempUser = { id: tokenPayload.userId };
          setUserData(tempUser);
          fetchReportData(tokenPayload.userId);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setError('Unable to decode authentication token');
      }
    } else {
      setError('No user data found. Please log in again.');
    }
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchReportData = async (userId) => {
    setIsLoading(true);
    setError('');

    try {
      // Fetch budgets
      const budgetsResponse = await fetch(`http://localhost:5000/api/budgets/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      // Fetch transactions
      const transactionsResponse = await fetch(`http://localhost:5000/api/transactions/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      let budgetsData = [];
      let transactionsData = [];

      if (budgetsResponse.ok) {
        const budgetResult = await budgetsResponse.json();
        budgetsData = budgetResult.budgets || [];
        setBudgets(budgetsData);
      }

      if (transactionsResponse.ok) {
        const transactionResult = await transactionsResponse.json();
        transactionsData = transactionResult.transactions || [];
        setTransactions(transactionsData);
      }

      // Calculate report data
      calculateReportData(budgetsData, transactionsData);

    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Unable to fetch report data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateReportData = (budgetsData, transactionsData) => {
    // Calculate totals from transactions
    const totalIncome = transactionsData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpenses = transactionsData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate budget totals
    const totalBudget = budgetsData.reduce((sum, b) => sum + (b.budgetAmount || 0), 0);
    const totalSpent = budgetsData.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
    const remainingBudget = totalBudget - totalSpent;

    // Find over budget and warning categories
    const overBudgetCategories = [];
    const warningCategories = [];

    budgetsData.forEach(budget => {
      const percentage = ((budget.spentAmount || 0) / (budget.budgetAmount || 1)) * 100;
      
      if (percentage >= 100) {
        overBudgetCategories.push({
          category: budget.category,
          budgetAmount: budget.budgetAmount,
          spentAmount: budget.spentAmount,
          percentage: percentage,
          overspent: (budget.spentAmount || 0) - (budget.budgetAmount || 0)
        });
      } else if (percentage >= 80) {
        warningCategories.push({
          category: budget.category,
          budgetAmount: budget.budgetAmount,
          spentAmount: budget.spentAmount,
          percentage: percentage
        });
      }
    });

    // Prepare pie chart data for budget categories
    const pieChartData = budgetsData.map((budget, index) => {
      const colors = [
        '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
        '#f97316', '#84cc16', '#ec4899', '#06b6d4', '#8b5cf6',
        '#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'
      ];
      
      return {
        category: budget.category,
        budgetAmount: budget.budgetAmount || 0,
        spentAmount: budget.spentAmount || 0,
        percentage: budgetsData.length > 0 ? ((budget.budgetAmount || 0) / totalBudget * 100) : 0,
        color: colors[index % colors.length]
      };
    });

    setChartData(pieChartData);

    setReportData({
      totalIncome,
      totalExpenses,
      totalBudget,
      totalSpent,
      remainingBudget,
      overBudgetCategories,
      warningCategories
    });
  };

  const getBudgetStatus = (budget) => {
    const percentage = ((budget.spentAmount || 0) / (budget.budgetAmount || 1)) * 100;
    if (percentage >= 100) return { status: 'over', color: 'red', text: 'Over Budget' };
    if (percentage >= 80) return { status: 'warning', color: 'yellow', text: 'Near Limit' };
    return { status: 'good', color: 'green', text: 'On Track' };
  };

  const formatCurrency = (amount) => {
    return `${currency}${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Simple Pie Chart Component (without external library)
  const PieChart = ({ data }) => {
    const centerX = 150;
    const centerY = 150;
    const radius = 120;
    let cumulativePercentage = 0;

    const createPath = (percentage, startAngle) => {
      const angle = (percentage / 100) * 360;
      const endAngle = startAngle + angle;
      
      const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
      const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
      const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
      const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    };

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">No budget data available</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Budget Distribution by Category</h3>
        <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
          {/* Pie Chart SVG */}
          <div className="flex-shrink-0">
            <svg width="300" height="300" viewBox="0 0 300 300">
              {data.map((item, index) => {
                const startAngle = cumulativePercentage * 3.6;
                const path = createPath(item.percentage, startAngle);
                cumulativePercentage += item.percentage;
                
                return (
                  <g key={index}>
                    <path
                      d={path}
                      fill={item.color}
                      stroke="#fff"
                      strokeWidth="2"
                      className="hover:opacity-80 transition-opacity duration-200"
                    />
                  </g>
                );
              })}
              {/* Center circle for donut effect */}
              <circle
                cx={centerX}
                cy={centerY}
                r="40"
                fill="white"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              <text
                x={centerX}
                y={centerY - 5}
                textAnchor="middle"
                className="text-sm font-semibold fill-gray-700"
              >
                Total
              </text>
              <text
                x={centerX}
                y={centerY + 10}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {formatCurrency(data.reduce((sum, item) => sum + item.budgetAmount, 0))}
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-1 max-w-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.category}
                    </p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatCurrency(item.budgetAmount)}</span>
                      <span>{item.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ 
                          backgroundColor: item.color,
                          width: `${(item.spentAmount / item.budgetAmount) * 100}%`
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Spent: {formatCurrency(item.spentAmount)}</span>
                      <span>{((item.spentAmount / item.budgetAmount) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Category Analysis Component
  const CategoryAnalysis = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Analysis</h3>
      <div className="space-y-4">
        {chartData.map((item, index) => {
          const spentPercentage = (item.spentAmount / item.budgetAmount) * 100;
          const status = spentPercentage >= 100 ? 'over' : spentPercentage >= 80 ? 'warning' : 'good';
          
          return (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <h4 className="font-medium text-gray-900">{item.category}</h4>
                </div>
                <span className={`text-sm font-medium ${
                  status === 'over' ? 'text-red-600' : 
                  status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {status === 'over' ? 'Over Budget' : 
                   status === 'warning' ? 'Near Limit' : 'On Track'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="text-sm font-semibold">{formatCurrency(item.budgetAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Spent</p>
                  <p className="text-sm font-semibold">{formatCurrency(item.spentAmount)}</p>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    status === 'over' ? 'bg-red-500' :
                    status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{spentPercentage.toFixed(1)}% used</span>
                <span>{formatCurrency(item.budgetAmount - item.spentAmount)} remaining</span>
              </div>
            </div>
          );
        })}
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
            <h1 className="ml-4 text-xl font-bold text-violet-900">Financial Reports</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            <p className="mt-2 text-violet-600">Loading reports...</p>
          </div>
        )}

        {/* Budget Warnings */}
        {(reportData.overBudgetCategories.length > 0 || reportData.warningCategories.length > 0) && (
          <div className="mb-8 space-y-4">
            {/* Over Budget Alerts */}
            {reportData.overBudgetCategories.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-semibold text-red-900">Budget Exceeded!</h3>
                </div>
                <div className="space-y-3">
                  {reportData.overBudgetCategories.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-red-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-red-900">{item.category}</h4>
                          <p className="text-sm text-red-700">
                            Overspent by {formatCurrency(item.overspent)} ({item.percentage.toFixed(1)}% of budget)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-red-600">
                            {formatCurrency(item.spentAmount)} / {formatCurrency(item.budgetAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning Alerts */}
            {reportData.warningCategories.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 text-yellow-600 mr-3" />
                  <h3 className="text-lg font-semibold text-yellow-900">Budget Warning</h3>
                </div>
                <div className="space-y-3">
                  {reportData.warningCategories.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-yellow-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-yellow-900">{item.category}</h4>
                          <p className="text-sm text-yellow-700">
                            {item.percentage.toFixed(1)}% of budget used
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-yellow-600">
                            {formatCurrency(item.spentAmount)} / {formatCurrency(item.budgetAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faChartBar} className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-gray-500 text-sm">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(reportData.totalIncome)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faWallet} className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-gray-500 text-sm">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(reportData.totalExpenses)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faChartPie} className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-gray-500 text-sm">Total Budget</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(reportData.totalBudget)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className={`h-8 w-8 mr-3 ${reportData.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className="text-gray-500 text-sm">Net Balance</p>
                <p className={`text-2xl font-bold ${reportData.totalIncome - reportData.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(reportData.totalIncome - reportData.totalExpenses)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart Section */}
        {chartData.length > 0 && (
          <div className="mb-8">
            <PieChart data={chartData} />
          </div>
        )}

        {/* Budget vs Spending Report */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Analysis */}
          <CategoryAnalysis />

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 bg-violet-50 border-b border-violet-100 rounded-t-xl">
              <h3 className="text-lg font-semibold text-violet-900">Recent Transactions</h3>
            </div>
            <div className="p-6">
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transactions found</p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.category}</p>
                          <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
          <div className="flex flex-wrap gap-4">
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200">
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Export as PDF
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200">
              <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
              Export as Excel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Report;
