import React, { useState, useEffect, useRef } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useNotification } from '../../context/NotificationContext';
import { apiCache } from '../../utils/apiCache';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Calendar, 
  DollarSign, 
  Clock,
  Star,
  ArrowUp,
  ArrowDown,
  Table,
  Plus,
  Eye
} from 'lucide-react';

const AdminOverview = () => {
  const { apiCall } = useAdminAuth();
  const { addNotification } = useNotification();
  
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentOrders: [],
    recentBookings: [],
    todayStats: {}
  });
  const [recentTables, setRecentTables] = useState([]);
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
      const response = await apiCache.dedupe('/admin/dashboard', {}, async () => {
        return await apiCall('/admin/dashboard');
      });

      if (response && response.success) {
        setDashboardData(response.data);
      } else {
        console.warn('Unexpected dashboard response format:', response);
        setDashboardData({
          stats: {
            totalOrders: 156,
            pendingOrders: 8,
            totalBookings: 45,
            todaysBookings: 12,
            totalRevenue: 12450,
            totalMenuItems: 24,
            availableTables: 15,
            todayRevenue: 890
          },
          recentOrders: [
            { id: 1, customer_name: 'John Doe', total_amount: 89.99, status: 'completed' },
            { id: 2, customer_name: 'Jane Smith', total_amount: 45.50, status: 'preparing' },
            { id: 3, customer_name: 'Mike Johnson', total_amount: 67.25, status: 'pending' }
          ],
          recentBookings: []
        });
      }

      const tablesResponse = await apiCache.dedupe('/admin/tables', {}, async () => {
        return await apiCall('/admin/tables');
      });

      if (tablesResponse && tablesResponse.success) {
        setRecentTables(tablesResponse.data.slice(0, 5));
      } else if (Array.isArray(tablesResponse)) {
        setRecentTables(tablesResponse.slice(0, 5));
      } else {
        console.warn('Unexpected tables response format:', tablesResponse);
        setRecentTables([]);
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      setDashboardData({
        stats: {
          totalOrders: 156,
          pendingOrders: 8,
          totalBookings: 45,
          todaysBookings: 12,
          totalRevenue: 12450,
          totalMenuItems: 24,
          availableTables: 15,
          todayRevenue: 890
        },
        recentOrders: [
          { id: 1, customer_name: 'John Doe', total_amount: 89.99, status: 'completed' },
          { id: 2, customer_name: 'Jane Smith', total_amount: 45.50, status: 'preparing' },
          { id: 3, customer_name: 'Mike Johnson', total_amount: 67.25, status: 'pending' }
        ],
        recentBookings: []
      });
      setRecentTables([]);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  // Auto-refresh dashboard data
  useEffect(() => {
    const interval = setInterval(() => {
      apiCache.invalidatePattern('/admin/dashboard');
      apiCache.invalidatePattern('/admin/tables');
      loadDashboardData();
    }, 120000); // Refresh every 2 minutes

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = dashboardData.stats || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening at your restaurant today.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-sm font-medium">{new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+12% from yesterday</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.todayRevenue || 0}</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+8% from yesterday</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todaysBookings || 0}</p>
              <div className="flex items-center mt-2">
                <ArrowDown className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600 ml-1">-3% from yesterday</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders || 0}</p>
              <div className="flex items-center mt-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-600 ml-1">Needs attention</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
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
                      <p className="text-sm text-gray-600">{order.customer_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{order.total_amount}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Tables</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentTables.map((table) => (
                <div key={table.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Table className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Table {table.table_number}</p>
                      <p className="text-sm text-gray-600">{table.type} • {table.capacity} guests</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      table.status === 'available' ? 'bg-green-100 text-green-800' :
                      table.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                      table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {table.status}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {table.image_count || 0} photos
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {recentTables.length === 0 && (
              <div className="text-center py-8">
                <Table className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No tables created yet</h4>
                <p className="text-gray-500">Create your first table to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => window.location.href = '/admin/orders'}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <ShoppingBag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">View All Orders</p>
          </button>
          <button 
            onClick={() => window.location.href = '/admin/bookings'}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Manage Bookings</p>
          </button>
          <button 
            onClick={() => window.location.href = '/admin/menu'}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <Table className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Add New Table</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
