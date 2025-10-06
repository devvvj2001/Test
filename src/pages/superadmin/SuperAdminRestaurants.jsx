import React, { useState, useEffect, useRef } from 'react';
import { useSuperAdminAuth } from '../../context/SuperAdminAuthContext';
import { useNotification } from '../../context/NotificationContext';
import { apiCache } from '../../utils/apiCache';
import { Building, Search, Plus, CreditCard as Edit, Trash2, Eye, Star, MapPin, Phone, Users, DollarSign, X, Save } from 'lucide-react';

const SuperAdminRestaurants = () => {
  const { apiCall } = useSuperAdminAuth();
  const { addNotification } = useNotification();
  
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const loadingRef = useRef(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    cuisine: '',
    address: '',
    phone: '',
    description: '',
    image: '',
    admin_id: '',
    admin_password: ''
  });

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [restaurants, searchTerm]);

  const loadRestaurants = async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const response = await apiCache.dedupe('/super-admin/restaurants', {}, async () => {
        return await apiCall('/super-admin/restaurants');
      });

      if (response.success) {
        setRestaurants(response.data || []);
      } else if (Array.isArray(response)) {
        setRestaurants(response);
      } else {
        console.warn('Unexpected restaurants response format:', response);
        setRestaurants([]);
      }
    } catch (error) {
      console.error('Failed to load restaurants:', error);
      addNotification('Failed to load restaurants from server', 'error');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  // Auto-refresh restaurants data
  useEffect(() => {
    const interval = setInterval(() => {
      apiCache.invalidatePattern('/super-admin/restaurants');
      loadRestaurants();
    }, 120000); // Refresh every 2 minutes

    return () => clearInterval(interval);
  }, []);

  const filterRestaurants = () => {
    let filtered = [...restaurants];

    if (searchTerm) {
      filtered = filtered.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.admin_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRestaurants(filtered);
  };

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newRestaurant.name || !newRestaurant.cuisine || !newRestaurant.address || 
        !newRestaurant.phone || !newRestaurant.admin_id || !newRestaurant.admin_password) {
      addNotification('Please fill in all required fields', 'error');
      return;
    }

    // Validate admin_id format
    if (!/^[A-Z]{2}\d{3}$/.test(newRestaurant.admin_id)) {
      addNotification('Admin ID must be in format: XX000 (e.g., RS001)', 'error');
      return;
    }

    // Validate password strength
    if (newRestaurant.admin_password.length < 6) {
      addNotification('Admin password must be at least 6 characters long', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiCall('/super-admin/restaurants', {
        method: 'POST',
        body: newRestaurant
      });

      if (response.success) {
        addNotification('Restaurant added successfully', 'success');
        setShowAddModal(false);
        setNewRestaurant({
          name: '',
          cuisine: '',
          address: '',
          phone: '',
          description: '',
          image: '',
          admin_id: '',
          admin_password: ''
        });
        loadRestaurants();
      }
    } catch (error) {
      addNotification(error.message || 'Failed to add restaurant', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRestaurant = async (e) => {
    e.preventDefault();
    
    if (!editingRestaurant.name || !editingRestaurant.cuisine || !editingRestaurant.address || 
        !editingRestaurant.phone) {
      addNotification('Please fill in all required fields', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiCall(`/super-admin/restaurants/${editingRestaurant.id}`, {
        method: 'PUT',
        body: editingRestaurant
      });

      if (response.success) {
        addNotification('Restaurant updated successfully', 'success');
        setShowEditModal(false);
        setEditingRestaurant(null);
        loadRestaurants();
      }
    } catch (error) {
      addNotification(error.message || 'Failed to update restaurant', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  const toggleRestaurantStatus = async (restaurantId, currentStatus) => {
    try {
      const response = await apiCall(`/super-admin/restaurants/${restaurantId}/status`, {
        method: 'PUT',
        body: { is_active: !currentStatus }
      });

      if (response && response.success) {
        setRestaurants(prev => prev.map(restaurant => 
          restaurant.id === restaurantId 
            ? { ...restaurant, is_active: !currentStatus }
            : restaurant
        ));
        addNotification(`Restaurant ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
        // Reload restaurants to ensure consistency
        setTimeout(() => loadRestaurants(), 1000);
      } else {
        // Update locally for demo to prevent data loss
        setRestaurants(prev => prev.map(restaurant => 
          restaurant.id === restaurantId 
            ? { ...restaurant, is_active: !currentStatus }
            : restaurant
        ));
        addNotification(`Restaurant ${!currentStatus ? 'activated' : 'deactivated'} locally`, 'success');
      }
    } catch (error) {
      console.error('Failed to update restaurant status:', error);
      // Update locally to prevent data loss
      setRestaurants(prev => prev.map(restaurant => 
        restaurant.id === restaurantId 
          ? { ...restaurant, is_active: !currentStatus }
          : restaurant
      ));
      addNotification(`Restaurant ${!currentStatus ? 'activated' : 'deactivated'} locally`, 'success');
    }
  };

  const cuisineTypes = [
    'Fine Dining', 'Italian', 'Japanese', 'Chinese', 'Mexican', 'Indian', 'Thai', 'French', 
    'Mediterranean', 'American', 'Korean', 'Vietnamese', 'Greek', 'Spanish', 'Fast Food'
  ];
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
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
          <p className="text-gray-600">Oversee all restaurants on the platform</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Restaurant</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="flex space-x-2">
            <span className="text-sm text-gray-500 flex items-center">Total: {restaurants.length}</span>
            <span className="text-sm text-green-600 flex items-center">
              Active: {restaurants.filter(r => r.is_active).length}
            </span>
          </div>
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRestaurants.map((restaurant) => (
          <div key={restaurant.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative">
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  restaurant.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {restaurant.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-semibold">{restaurant.rating}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-900">{restaurant.name}</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {restaurant.cuisine}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{restaurant.address}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{restaurant.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Admin: {restaurant.admin_id}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{restaurant.total_orders || 0}</p>
                  <p className="text-xs text-gray-500">Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">₹{restaurant.revenue?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSelectedRestaurant(restaurant);
                    setShowDetails(true);
                  }}
                  className="bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => {
                    setEditingRestaurant(restaurant);
                    setShowEditModal(true);
                  }}
                  className="bg-gray-50 text-gray-600 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>
              <div className="mt-2">
                <button
                  onClick={() => toggleRestaurantStatus(restaurant.id, restaurant.is_active)}
                  className={`w-full py-2 px-3 rounded-lg transition-colors text-sm font-medium ${
                    restaurant.is_active 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {restaurant.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRestaurants.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants found</h3>
          <p className="text-gray-500">No restaurants match your search criteria.</p>
        </div>
      )}

      {/* Add Restaurant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Add New Restaurant</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddRestaurant} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name *</label>
                    <input
                      type="text"
                      value={newRestaurant.name}
                      onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Enter restaurant name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type *</label>
                    <select
                      value={newRestaurant.cuisine}
                      onChange={(e) => setNewRestaurant({...newRestaurant, cuisine: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      required
                    >
                      <option value="">Select cuisine type</option>
                      {cuisineTypes.map(cuisine => (
                        <option key={cuisine} value={cuisine}>{cuisine}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                  <input
                    type="text"
                    value={newRestaurant.address}
                    onChange={(e) => setNewRestaurant({...newRestaurant, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Enter full address"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={newRestaurant.phone}
                      onChange={(e) => setNewRestaurant({...newRestaurant, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                    <input
                      type="url"
                      value={newRestaurant.image}
                      onChange={(e) => setNewRestaurant({...newRestaurant, image: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newRestaurant.description}
                    onChange={(e) => setNewRestaurant({...newRestaurant, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Describe the restaurant..."
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Admin Account Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Admin ID *</label>
                      <input
                        type="text"
                        value={newRestaurant.admin_id}
                        onChange={(e) => setNewRestaurant({...newRestaurant, admin_id: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="e.g., RS001"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Admin Password *</label>
                      <input
                        type="password"
                        value={newRestaurant.admin_password}
                        onChange={(e) => setNewRestaurant({...newRestaurant, admin_password: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="Enter admin password"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2 text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Adding...' : 'Add Restaurant'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Restaurant Modal */}
      {showEditModal && editingRestaurant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Edit Restaurant</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleEditRestaurant} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name *</label>
                    <input
                      type="text"
                      value={editingRestaurant.name}
                      onChange={(e) => setEditingRestaurant({...editingRestaurant, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type *</label>
                    <select
                      value={editingRestaurant.cuisine}
                      onChange={(e) => setEditingRestaurant({...editingRestaurant, cuisine: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      required
                    >
                      <option value="">Select cuisine type</option>
                      {cuisineTypes.map(cuisine => (
                        <option key={cuisine} value={cuisine}>{cuisine}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                  <input
                    type="text"
                    value={editingRestaurant.address}
                    onChange={(e) => setEditingRestaurant({...editingRestaurant, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={editingRestaurant.phone}
                      onChange={(e) => setEditingRestaurant({...editingRestaurant, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={editingRestaurant.rating}
                      onChange={(e) => setEditingRestaurant({...editingRestaurant, rating: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <input
                    type="url"
                    value={editingRestaurant.image}
                    onChange={(e) => setEditingRestaurant({...editingRestaurant, image: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editingRestaurant.description}
                    onChange={(e) => setEditingRestaurant({...editingRestaurant, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Updating...' : 'Update Restaurant'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Restaurant Details Modal */}
      {showDetails && selectedRestaurant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Restaurant Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={selectedRestaurant.image}
                    alt={selectedRestaurant.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedRestaurant.name}</h4>
                    <p className="text-sm text-gray-500">{selectedRestaurant.cuisine}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Rating</p>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-900">{selectedRestaurant.rating}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedRestaurant.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedRestaurant.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Address</p>
                  <p className="text-sm text-gray-900">{selectedRestaurant.address}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <p className="text-sm text-gray-900">{selectedRestaurant.phone}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Admin ID</p>
                  <p className="text-sm text-gray-900">{selectedRestaurant.admin_id}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedRestaurant.total_orders || 0}</p>
                    <p className="text-sm text-gray-500">Total Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">₹{selectedRestaurant.revenue?.toLocaleString() || 0}</p>
                    <p className="text-sm text-gray-500">Revenue</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setEditingRestaurant(selectedRestaurant);
                    setShowDetails(false);
                    setShowEditModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Restaurant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminRestaurants;