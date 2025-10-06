import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  ShoppingBag, 
  Clock, 
  DollarSign, 
  Search, 
  Eye, 
  CheckCircle,
  Package,
  Truck,
  XCircle
} from 'lucide-react';

const AdminOrders = () => {
  const { apiCall } = useAdminAuth();
  const { addNotification } = useNotification();
  
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/admin/orders');
      if (response && response.success) {
        setOrders(response.data || []);
      } else if (Array.isArray(response)) {
        // Handle direct array response
        setOrders(response);
      } else {
        console.warn('Unexpected orders response format:', response);
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      // Use mock data for demo
      setOrders([
        {
          id: 1,
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          order_type: 'dine-in',
          status: 'completed',
          total_amount: 89.99,
          created_at: new Date().toISOString(),
          items: [
            { item_name: 'Wagyu Beef Tenderloin', quantity: 1, price: 89.99 }
          ]
        },
        {
          id: 2,
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          order_type: 'pickup',
          status: 'preparing',
          total_amount: 45.50,
          created_at: new Date().toISOString(),
          items: [
            { item_name: 'Pan-Seared Salmon', quantity: 1, price: 32.99 },
            { item_name: 'Truffle Arancini', quantity: 1, price: 18.99 }
          ]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh orders data
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toString().includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await apiCall(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: { status: newStatus }
      });

      if (response.success) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        addNotification('Order status updated successfully', 'success');
        // Reload orders to ensure consistency
        setTimeout(() => loadOrders(), 1000);
      }
    } catch (error) {
      addNotification('Failed to update order status', 'error');
    }
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'preparing': return <Package className="w-4 h-4" />;
      case 'ready': return <Truck className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Track and manage all customer orders</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-lg font-semibold text-blue-600">{orders.length}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Pending', status: 'pending', color: 'yellow' },
          { label: 'Confirmed', status: 'confirmed', color: 'blue' },
          { label: 'Preparing', status: 'preparing', color: 'orange' },
          { label: 'Ready', status: 'ready', color: 'green' },
          { label: 'Completed', status: 'completed', color: 'green' }
        ].map((stat) => (
          <div key={stat.status} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className={`text-xl font-bold text-${stat.color}-600`}>
                  {orders.filter(o => o.status === stat.status).length}
                </p>
              </div>
              {getStatusIcon(stat.status)}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
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
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">{order.customer_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">{order.order_type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-900">₹{order.total_amount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(order.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetails(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">No orders match your current filters.</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details #{selectedOrder.id}</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Customer:</p>
                  <p className="text-sm text-gray-900">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customer_email}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Order Type:</p>
                  <p className="text-sm text-gray-900 capitalize">{selectedOrder.order_type}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Amount:</p>
                  <p className="text-sm text-gray-900">₹{selectedOrder.total_amount}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Status:</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                
                {selectedOrder.special_instructions && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Special Instructions:</p>
                    <p className="text-sm text-gray-900">{selectedOrder.special_instructions}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Order Items:</p>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.item_name} x{item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;