import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Users, Search, Mail, Phone, Calendar, Eye, CreditCard as Edit, Trash2, ShoppingBag, X, CheckCircle, Clock } from 'lucide-react';

const AdminCustomers = () => {
  const { apiCall } = useAdminAuth();
  const { addNotification } = useNotification();

  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/admin/customers');
      if (response && response.success) {
        setCustomers(response.data || []);
      } else if (Array.isArray(response)) {
        setCustomers(response);
      } else {
        console.warn('Unexpected customers response format:', response);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
      console.warn('Customers endpoint not available, using empty data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerOrders = async (customerId) => {
    setIsLoadingOrders(true);
    try {
      const response = await apiCall('/admin/orders');
      if (response && response.success) {
        // Filter orders for this specific customer
        const allOrders = response.data || [];
        const customerSpecificOrders = allOrders.filter(order =>
          order.customer_email === selectedCustomer.email ||
          order.customer_name === selectedCustomer.name
        );
        setCustomerOrders(customerSpecificOrders);
      } else if (Array.isArray(response)) {
        const customerSpecificOrders = response.filter(order =>
          order.customer_email === selectedCustomer.email ||
          order.customer_name === selectedCustomer.name
        );
        setCustomerOrders(customerSpecificOrders);
      } else {
        setCustomerOrders([]);
      }
    } catch (error) {
      console.error('Failed to load customer orders:', error);
      addNotification('Failed to load customer orders', 'error');
      setCustomerOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm))
      );
    }

    setFilteredCustomers(filtered);
  };

  const handleViewOrders = async (customer) => {
    setSelectedCustomer(customer);
    setShowOrdersModal(true);
    await loadCustomerOrders(customer.id);
  };

  const getPaymentStatus = (order) => {
    // Payment is considered "Paid" if order status is completed
    // Payment is "Pending" for all other statuses
    return order.status === 'completed' ? 'paid' : 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Data</h1>
          <p className="text-gray-600">Manage customer information and history</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Total Customers:</span>
          <span className="text-lg font-semibold text-blue-600">{customers.length}</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-500">Customer ID: #{customer.id}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomer(customer);
                  setShowCustomerDetails(true);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{customer.email}</span>
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

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-blue-600">{customer.total_orders || 0}</p>
                  <p className="text-xs text-gray-500">Orders</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-600">₹{customer.total_spent || 0}</p>
                  <p className="text-xs text-gray-500">Spent</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => handleViewOrders(customer)}
                className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                View Orders
              </button>
              <button className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-500">No customers match your search criteria.</p>
        </div>
      )}

      {/* Customer Details Modal */}
      {showCustomerDetails && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Details</h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xl">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</h4>
                    <p className="text-sm text-gray-500">Customer ID: #{selectedCustomer.id}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email:</p>
                    <p className="text-sm text-gray-900">{selectedCustomer.email}</p>
                  </div>

                  {selectedCustomer.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone:</p>
                      <p className="text-sm text-gray-900">{selectedCustomer.phone}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-700">Member Since:</p>
                    <p className="text-sm text-gray-900">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedCustomer.total_orders || 0}</p>
                      <p className="text-sm text-gray-500">Total Orders</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">₹{selectedCustomer.total_spent || 0}</p>
                      <p className="text-sm text-gray-500">Total Spent</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCustomerDetails(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowCustomerDetails(false);
                    handleViewOrders(selectedCustomer);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Orders Modal */}
      {showOrdersModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Orders for {selectedCustomer.name}
              </h3>
              <button
                onClick={() => {
                  setShowOrdersModal(false);
                  setCustomerOrders([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : customerOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500">This customer hasn't placed any orders yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {customerOrders.map((order) => {
                  const paymentStatus = getPaymentStatus(order);
                  return (
                    <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-lg font-semibold text-gray-900">Order #{order.id}</h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600 capitalize">
                            Type: {order.order_type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">₹{order.total_amount.toFixed(2)}</p>
                          <div className={`mt-2 inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold ${
                            paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {paymentStatus === 'paid' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                            <span>{paymentStatus === 'paid' ? 'Paid' : 'Pending'}</span>
                          </div>
                        </div>
                      </div>

                      {order.special_instructions && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700">Special Instructions:</p>
                          <p className="text-sm text-gray-600">{order.special_instructions}</p>
                        </div>
                      )}

                      {order.items && order.items.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Order Items:</p>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                  {item.item_name} x{item.quantity}
                                </span>
                                <span className="text-gray-900 font-medium">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowOrdersModal(false);
                  setCustomerOrders([]);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
