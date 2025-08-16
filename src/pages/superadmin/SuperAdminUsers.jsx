import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Mail,
  Phone,
  Calendar,
  Crown,
  Shield,
  User
} from 'lucide-react';

const SuperAdminUsers = () => {
  const { apiCall } = useAuth();
  const { addNotification } = useNotification();
  
  const [users, setUsers] = useState({ customers: [], admins: [] });
  const [filteredUsers, setFilteredUsers] = useState({ customers: [], admins: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, userTypeFilter]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/super-admin/users');
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      addNotification('Failed to load users', 'error');
      // Use mock data for demo
      setUsers({
        customers: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1 (555) 123-4567',
            role: 'customer',
            is_active: true,
            created_at: '2024-01-15',
            total_orders: 12,
            total_spent: 450
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+1 (555) 234-5678',
            role: 'customer',
            is_active: true,
            created_at: '2024-02-20',
            total_orders: 8,
            total_spent: 320
          }
        ],
        admins: [
          {
            id: 3,
            name: 'Golden Spoon Admin',
            email: 'admin@goldenspoon.com',
            role: 'admin',
            restaurant_name: 'The Golden Spoon',
            is_active: true,
            created_at: '2024-01-10'
          },
          {
            id: 4,
            name: 'Platform Owner',
            email: 'owner@restaurantai.com',
            role: 'superadmin',
            is_active: true,
            created_at: '2024-01-01'
          }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filteredCustomers = [...users.customers];
    let filteredAdmins = [...users.admins];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredCustomers = filteredCustomers.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.phone && user.phone.includes(searchTerm))
      );
      filteredAdmins = filteredAdmins.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.restaurant_name && user.restaurant_name.toLowerCase().includes(searchLower))
      );
    }

    setFilteredUsers({ customers: filteredCustomers, admins: filteredAdmins });
  };

  const toggleUserStatus = async (userId, userType, currentStatus) => {
    try {
      const endpoint = userType === 'customers' ? 
        `/super-admin/customers/${userId}/status` : 
        `/super-admin/admins/${userId}/status`;
        
      const response = await apiCall(endpoint, {
        method: 'PUT',
        body: { is_active: !currentStatus }
      });

      if (response.success) {
        setUsers(prev => ({
          ...prev,
          [userType]: prev[userType].map(user => 
            user.id === userId 
              ? { ...user, is_active: !currentStatus }
              : user
          )
        }));
        addNotification(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
      }
    } catch (error) {
      addNotification('Failed to update user status', 'error');
    }
  };

  const getUserIcon = (role) => {
    switch (role) {
      case 'superadmin': return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'admin': return <Shield className="w-5 h-5 text-blue-500" />;
      default: return <User className="w-5 h-5 text-gray-500" />;
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">User Administration</h1>
          <p className="text-gray-600">Manage all platform users and administrators</p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-center">
            <p className="font-semibold text-blue-600">{users.customers.length}</p>
            <p className="text-gray-500">Customers</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-purple-600">{users.admins.length}</p>
            <p className="text-gray-500">Admins</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="all">All Users</option>
            <option value="customers">Customers Only</option>
            <option value="admins">Admins Only</option>
          </select>
        </div>
      </div>

      {/* Users Sections */}
      <div className="space-y-8">
        {/* Customers Section */}
        {(userTypeFilter === 'all' || userTypeFilter === 'customers') && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Users className="w-6 h-6 text-blue-600" />
                <span>Customers ({filteredUsers.customers.length})</span>
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.customers.map((customer) => (
                  <div key={customer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                          <p className="text-sm text-gray-500">ID: #{customer.id}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        customer.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-center">
                      <div>
                        <p className="text-lg font-bold text-blue-600">{customer.total_orders || 0}</p>
                        <p className="text-xs text-gray-500">Orders</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">${customer.total_spent || 0}</p>
                        <p className="text-xs text-gray-500">Spent</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(customer);
                          setShowUserDetails(true);
                        }}
                        className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => toggleUserStatus(customer.id, 'customers', customer.is_active)}
                        className={`py-2 px-3 rounded-lg transition-colors text-sm ${
                          customer.is_active 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {customer.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Admins Section */}
        {(userTypeFilter === 'all' || userTypeFilter === 'admins') && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Shield className="w-6 h-6 text-purple-600" />
                <span>Administrators ({filteredUsers.admins.length})</span>
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.admins.map((admin) => (
                  <div key={admin.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          {getUserIcon(admin.role)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{admin.name}</h3>
                          <p className="text-sm text-gray-500 capitalize">{admin.role}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        admin.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{admin.email}</span>
                      </div>
                      {admin.restaurant_name && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Shield className="w-4 h-4" />
                          <span className="truncate">{admin.restaurant_name}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Since {new Date(admin.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(admin);
                          setShowUserDetails(true);
                        }}
                        className="flex-1 bg-purple-50 text-purple-600 py-2 px-3 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                      >
                        View Details
                      </button>
                      {admin.role !== 'superadmin' && (
                        <button
                          onClick={() => toggleUserStatus(admin.id, 'admins', admin.is_active)}
                          className={`py-2 px-3 rounded-lg transition-colors text-sm ${
                            admin.is_active 
                              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {admin.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    {getUserIcon(selectedUser.role)}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h4>
                    <p className="text-sm text-gray-500 capitalize">{selectedUser.role}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email:</p>
                    <p className="text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  
                  {selectedUser.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone:</p>
                      <p className="text-sm text-gray-900">{selectedUser.phone}</p>
                    </div>
                  )}
                  
                  {selectedUser.restaurant_name && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Restaurant:</p>
                      <p className="text-sm text-gray-900">{selectedUser.restaurant_name}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Member Since:</p>
                    <p className="text-sm text-gray-900">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status:</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedUser.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {selectedUser.role === 'customer' && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{selectedUser.total_orders || 0}</p>
                        <p className="text-sm text-gray-500">Total Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">${selectedUser.total_spent || 0}</p>
                        <p className="text-sm text-gray-500">Total Spent</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminUsers;