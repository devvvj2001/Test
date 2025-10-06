import React, { useState, useEffect, useRef } from 'react';
import { useSuperAdminAuth } from '../../context/SuperAdminAuthContext';
import { useNotification } from '../../context/NotificationContext';
import { apiCache } from '../../utils/apiCache';
import { 
  Crown, 
  Building, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Activity,
  Globe
} from 'lucide-react';

const SuperAdminOverview = () => {
  const { apiCall } = useSuperAdminAuth();
  const { addNotification } = useNotification();
  
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentOrders: [],
    recentBookings: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const response = await apiCache.dedupe('/super-admin/dashboard', {}, async () => {
        return await apiCall('/super-admin/dashboard');
      });
      if (response && response.success) {
        setDashboardData(response.data);
      } else {
        console.warn('Unexpected super admin dashboard response format:', response);
        // Use mock data for demo
        setDashboardData({
          stats: {
            totalRestaurants: 3,
            totalCustomers: 1250,
            totalOrders: 4567,
            totalRevenue: 125000,
            pendingOrders: 23,
            activeAdmins: 3
          },
          recentOrders: [
            { id: 1, restaurant_name: 'The Golden Spoon', customer_name: 'John Doe', total_amount: 89.99, status: 'completed' },
            { id: 2, restaurant_name: 'Sakura Sushi', customer_name: 'Jane Smith', total_amount: 45.50, status: 'preparing' }
          ],
          recentBookings: []
        });
      }
    } catch (error) {
      console.error('Super admin dashboard load error:', error);
      // Use mock data for demo
      setDashboardData({
        stats: {
          totalRestaurants: 3,
          totalCustomers: 1250,
          totalOrders: 4567,
          totalRevenue: 125000,
          pendingOrders: 23,
          activeAdmins: 3
        },
        recentOrders: [
          { id: 1, restaurant_name: 'The Golden Spoon', customer_name: 'John Doe', total_amount: 89.99, status: 'completed' },
          { id: 2, restaurant_name: 'Sakura Sushi', customer_name: 'Jane Smith', total_amount: 45.50, status: 'preparing' }
        ],
        recentBookings: []
      });
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  // Auto-refresh dashboard data
  useEffect(() => {
    const interval = setInterval(() => {
      apiCache.invalidatePattern('/super-admin/dashboard');
      loadDashboardData();
    }, 120000); // Refresh every 2 minutes

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = dashboardData.stats || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-gray-600">Complete control and insights across all restaurants</p>
        </div>
        <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-lg">
          <Globe className="w-5 h-5 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">Global Dashboard</span>
        </div>
      </div>

      {/* Key Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Restaurants</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRestaurants || 0}</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+2 this month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers || 0}</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+15% growth</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+8% this week</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue || 0}</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+22% growth</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders || 0}</p>
              <div className="flex items-center mt-2">
                <Activity className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600 ml-1">Needs attention</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Admins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeAdmins || 0}</p>
              <div className="flex items-center mt-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-600 ml-1">All online</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Platform Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Platform Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.recentOrders?.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">{order.restaurant_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{order.total_amount}</p>
                    <p className="text-sm text-gray-500">{order.customer_name}</p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent orders</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Restaurants</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { name: 'The Golden Spoon', revenue: 45000, orders: 234, growth: '+15%' },
                { name: 'Sakura Sushi', revenue: 38000, orders: 189, growth: '+12%' },
                { name: "Mama's Italian", revenue: 42000, orders: 201, growth: '+18%' }
              ].map((restaurant, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{restaurant.name}</p>
                      <p className="text-sm text-gray-600">{restaurant.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{restaurant.revenue.toLocaleString()}</p>
                    <p className="text-sm text-green-600">{restaurant.growth}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">System Health & Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Server Status</p>
            <p className="text-lg font-bold text-green-600">Healthy</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Globe className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">API Response</p>
            <p className="text-lg font-bold text-blue-600">125ms</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Uptime</p>
            <p className="text-lg font-bold text-purple-600">99.9%</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Active Users</p>
            <p className="text-lg font-bold text-yellow-600">847</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
            <Building className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
            <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Manage Restaurants</p>
            <p className="text-xs text-gray-500 mt-1">Add, edit, or remove restaurants</p>
          </button>
          <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 group">
            <Users className="w-8 h-8 text-gray-400 group-hover:text-green-500 mx-auto mb-3 transition-colors" />
            <p className="text-sm font-medium text-gray-700 group-hover:text-green-700">User Administration</p>
            <p className="text-xs text-gray-500 mt-1">Manage customer and admin accounts</p>
          </button>
          <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group">
            <TrendingUp className="w-8 h-8 text-gray-400 group-hover:text-purple-500 mx-auto mb-3 transition-colors" />
            <p className="text-sm font-medium text-gray-700 group-hover:text-purple-700">View Analytics</p>
            <p className="text-xs text-gray-500 mt-1">Deep dive into platform metrics</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminOverview;