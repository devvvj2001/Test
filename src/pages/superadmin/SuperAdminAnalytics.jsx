import React, { useState, useEffect } from 'react';
import { useSuperAdminAuth } from '../../context/SuperAdminAuthContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Building,
  Calendar,
  PieChart,
  Activity
} from 'lucide-react';

const SuperAdminAnalytics = () => {
  const { apiCall } = useSuperAdminAuth();
  const { addNotification } = useNotification();
  
  const [analyticsData, setAnalyticsData] = useState({
    revenueByMonth: [],
    restaurantPerformance: [],
    orderStatusDistribution: [],
    popularCuisines: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall(`/super-admin/analytics?range=${timeRange}`);
      if (response && response.success) {
        setAnalyticsData(response.data || {
          revenueByMonth: [],
          restaurantPerformance: [],
          orderStatusDistribution: [],
          popularCuisines: []
        });
      } else {
        console.warn('Unexpected analytics response format:', response);
        // Use mock data for demo
        setAnalyticsData({
          revenueByMonth: [
            { month: '2024-11', revenue: 45000, order_count: 234 },
            { month: '2024-12', revenue: 52000, order_count: 267 },
            { month: '2025-01', revenue: 48000, order_count: 245 }
          ],
          restaurantPerformance: [
            { name: 'The Golden Spoon', total_orders: 234, revenue: 45000, avg_rating: 4.8 },
            { name: 'Sakura Sushi', total_orders: 189, revenue: 38000, avg_rating: 4.6 },
            { name: "Mama's Italian", total_orders: 201, revenue: 42000, avg_rating: 4.7 }
          ],
          orderStatusDistribution: [
            { status: 'completed', count: 456, percentage: 65.2 },
            { status: 'pending', count: 123, percentage: 17.6 },
            { status: 'cancelled', count: 89, percentage: 12.7 },
            { status: 'preparing', count: 32, percentage: 4.5 }
          ],
          popularCuisines: [
            { cuisine: 'Fine Dining', order_count: 234, revenue: 45000 },
            { cuisine: 'Italian', order_count: 201, revenue: 42000 },
            { cuisine: 'Japanese', order_count: 189, revenue: 38000 }
          ]
        });
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Use mock data for demo
      setAnalyticsData({
        revenueByMonth: [
          { month: '2024-11', revenue: 45000, order_count: 234 },
          { month: '2024-12', revenue: 52000, order_count: 267 },
          { month: '2025-01', revenue: 48000, order_count: 245 }
        ],
        restaurantPerformance: [
          { name: 'The Golden Spoon', total_orders: 234, revenue: 45000, avg_rating: 4.8 },
          { name: 'Sakura Sushi', total_orders: 189, revenue: 38000, avg_rating: 4.6 },
          { name: "Mama's Italian", total_orders: 201, revenue: 42000, avg_rating: 4.7 }
        ],
        orderStatusDistribution: [
          { status: 'completed', count: 456, percentage: 65.2 },
          { status: 'pending', count: 123, percentage: 17.6 },
          { status: 'cancelled', count: 89, percentage: 12.7 },
          { status: 'preparing', count: 32, percentage: 4.5 }
        ],
        popularCuisines: [
          { cuisine: 'Fine Dining', order_count: 234, revenue: 45000 },
          { cuisine: 'Italian', order_count: 201, revenue: 42000 },
          { cuisine: 'Japanese', order_count: 189, revenue: 38000 }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh analytics data
  useEffect(() => {
    const interval = setInterval(() => {
      loadAnalytics();
    }, 120000); // Refresh every 2 minutes
    
    return () => clearInterval(interval);
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">Deep insights into platform performance and trends</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        <div className="h-64 flex items-end justify-between space-x-2">
          {analyticsData.revenueByMonth.map((month, index) => {
            const maxRevenue = Math.max(...analyticsData.revenueByMonth.map(m => m.revenue));
            const height = (month.revenue / maxRevenue) * 200;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-yellow-500 to-orange-500 rounded-t transition-all duration-500 hover:from-yellow-600 hover:to-orange-600"
                  style={{ height: `${height}px` }}
                  title={`${month.month}: ₹${month.revenue.toLocaleString()}`}
                ></div>
                <p className="text-xs text-gray-500 mt-2">{month.month}</p>
                <p className="text-xs text-gray-400">₹{month.revenue.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Restaurant Performance */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Restaurant Performance</h3>
          <div className="space-y-4">
            {analyticsData.restaurantPerformance.map((restaurant, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{restaurant.name}</p>
                    <p className="text-sm text-gray-500">{restaurant.total_orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{restaurant.revenue.toLocaleString()}</p>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-yellow-600">★ {restaurant.avg_rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Status Distribution</h3>
          <div className="space-y-4">
            {analyticsData.orderStatusDistribution.map((status, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    status.status === 'completed' ? 'bg-green-500' :
                    status.status === 'pending' ? 'bg-yellow-500' :
                    status.status === 'cancelled' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{status.status}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{status.count}</p>
                  <p className="text-xs text-gray-500">{status.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Cuisines */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Popular Cuisines</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analyticsData.popularCuisines.map((cuisine, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">{cuisine.cuisine}</h4>
              <p className="text-2xl font-bold text-blue-600 mb-1">{cuisine.order_count}</p>
              <p className="text-sm text-gray-500 mb-2">orders</p>
              <p className="text-lg font-semibold text-green-600">₹{cuisine.revenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500">revenue</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAnalytics;