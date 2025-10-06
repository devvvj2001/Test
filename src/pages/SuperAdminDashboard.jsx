import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  Crown, 
  Building, 
  Users, 
  ShoppingBag, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  BarChart3,
  Eye,
  Settings
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const { user, logout, apiCall } = useAuth();
  const { addNotification } = useNotification();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');
  const [dashboardStats, setDashboardStats] = useState({});
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load dashboard stats
      const dashboardResponse = await apiCall('/super-admin/dashboard');
      if (dashboardResponse.success) {
        setDashboardStats(dashboardResponse.data.stats);
      }

      // Load restaurants
      const restaurantsResponse = await apiCall('/super-admin/restaurants');
      if (restaurantsResponse.success) {
        setRestaurants(restaurantsResponse.data);
      }

      // Load users
      const usersResponse = await apiCall('/super-admin/users');
      if (usersResponse.success) {
        setUsers(usersResponse.data);
      }

      // Load orders
      const ordersResponse = await apiCall('/super-admin/orders');
      if (ordersResponse.success) {
        setOrders(ordersResponse.data);
      }

      // Load analytics
      const analyticsResponse = await apiCall('/super-admin/analytics');
      if (analyticsResponse.success) {
        setAnalytics(analyticsResponse.data);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set default data for demo
      setDashboardStats({
        totalRestaurants: 3,
        totalCustomers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        activeAdmins: 3
      });
      setRestaurants([]);
      setUsers({ customers: [], admins: [] });
      setOrders([]);
      setAnalytics({});
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = selectedRestaurant === 'all' 
    ? orders 
    : orders.filter(order => order.restaurant_id === parseInt(selectedRestaurant));

  const filteredRestaurants = restaurants;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading super admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Crown className="h-8 w-8 text-yellow-200" />
              <div>
                <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
                <p className="text-yellow-100">Platform-wide Management Control</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Restaurant Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-yellow-100">View Restaurant:</label>
                <select
                  value={selectedRestaurant}
                  onChange={(e) => setSelectedRestaurant(e.target.value)}
                  className="bg-white/20 text-white border border-white/30 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="all">All Restaurants</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id} className="text-gray-900">
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-yellow-100">Welcome,</p>
                <p className="font-semibold">{user?.name}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Platform Overview', icon: TrendingUp },
              { id: 'restaurants', label: 'Restaurants', icon: Building },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'orders', label: 'All Orders', icon: ShoppingBag },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Platform Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Building className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Restaurants</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardStats.totalRestaurants || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardStats.totalCustomers || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShoppingBag className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardStats.totalOrders || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Platform Revenue</dt>
                      <dd className="text-lg font-medium text-gray-900">₹{dashboardStats.totalRevenue || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Order #{order.id}</p>
                          <p className="text-sm text-gray-500">{order.restaurant_name} • {order.customer_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">₹{order.total_amount}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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

              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Top Performing Restaurants</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {restaurants.slice(0, 5).map((restaurant) => (
                      <div key={restaurant.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{restaurant.name}</p>
                          <p className="text-sm text-gray-500">{restaurant.cuisine}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">₹{restaurant.revenue || 0}</p>
                          <p className="text-sm text-gray-500">{restaurant.total_orders || 0} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'restaurants' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Restaurant Management</h2>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Restaurant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cuisine
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRestaurants.map((restaurant) => (
                      <tr key={restaurant.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={restaurant.image}
                              alt={restaurant.name}
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                              <div className="text-sm text-gray-500">{restaurant.address}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {restaurant.admin_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {restaurant.cuisine}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ⭐ {restaurant.rating}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {restaurant.total_orders || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{restaurant.revenue || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            restaurant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {restaurant.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Customers</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {users.customers?.map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Restaurant Admins</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {users.admins?.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                          <p className="text-sm text-gray-500">{admin.restaurant_name || admin.email}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          admin.is_active ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {admin.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">All Orders</h2>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Restaurant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.restaurant_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{order.customer_name}</div>
                            <div className="text-gray-500">{order.customer_email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {order.order_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{order.total_amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Platform Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Month</h3>
                <div className="space-y-3">
                  {analytics.revenueByMonth?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{item.month}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">₹{item.revenue}</div>
                        <div className="text-xs text-gray-500">{item.order_count} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Cuisines</h3>
                <div className="space-y-3">
                  {analytics.popularCuisines?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{item.cuisine}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">₹{item.revenue}</div>
                        <div className="text-xs text-gray-500">{item.order_count} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;