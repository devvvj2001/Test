import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  Building, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Star,
  MapPin,
  Phone,
  Users,
  DollarSign
} from 'lucide-react';

const SuperAdminRestaurants = () => {
  const { apiCall } = useAuth();
  const { addNotification } = useNotification();
  
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    cuisine: '',
    address: '',
    phone: '',
    description: '',
    image: '',
    admin_id: '',
    admin_password: 'admin123'
  });

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [restaurants, searchTerm]);

  const loadRestaurants = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/super-admin/restaurants');
      if (response.success) {
        setRestaurants(response.data);
      }
    } catch (error) {
      addNotification('Failed to load restaurants', 'error');
      // Use mock data for demo
      setRestaurants([
        {
          id: 1,
          name: 'The Golden Spoon',
          cuisine: 'Fine Dining',
          rating: 4.8,
          image: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg',
          address: '123 Gourmet Street, Downtown',
          phone: '+1 (555) 123-4567',
          admin_id: 'GS001',
          is_active: true,
          total_orders: 234,
          revenue: 45000,
          created_at: '2024-01-15'
        },
        {
          id: 2,
          name: 'Sakura Sushi',
          cuisine: 'Japanese',
          rating: 4.6,
          image: 'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg',
          address: '456 Zen Garden Ave, Midtown',
          phone: '+1 (555) 234-5678',
          admin_id: 'SS002',
          is_active: true,
          total_orders: 189,
          revenue: 38000,
          created_at: '2024-02-20'
        },
        {
          id: 3,
          name: "Mama's Italian",
          cuisine: 'Italian',
          rating: 4.7,
          image: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg',
          address: '789 Pasta Lane, Little Italy',
          phone: '+1 (555) 345-6789',
          admin_id: 'MI003',
          is_active: true,
          total_orders: 201,
          revenue: 42000,
          created_at: '2024-01-30'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

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

  const toggleRestaurantStatus = async (restaurantId, currentStatus) => {
    try {
      const response = await apiCall(`/super-admin/restaurants/${restaurantId}/status`, {
        method: 'PUT',
        body: { is_active: !currentStatus }
      });

      if (response.success) {
        setRestaurants(prev => prev.map(restaurant => 
          restaurant.id === restaurantId 
            ? { ...restaurant, is_active: !currentStatus }
            : restaurant
        ));
        addNotification(`Restaurant ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
      }
    } catch (error) {
      addNotification('Failed to update restaurant status', 'error');
    }
  };

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
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
          admin_password: 'admin123'
        });
        loadRestaurants();
      }
    } catch (error) {
      addNotification(error.message || 'Failed to add restaurant', 'error');
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
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
          <p className="text-gray-600">Oversee all restaurants on the platform</p>
        </div>
        <button className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 flex items-center space-x-2">
          <Plus className="w-5 h-5" onClick={() => setShowAddModal(true)} />
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
                  <p className="text-lg font-bold text-green-600">${restaurant.revenue?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedRestaurant(restaurant);
                    setShowDetails(true);
                  }}
                  className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button className="bg-gray-50 text-gray-600 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleRestaurantStatus(restaurant.id, restaurant.is_active)}
                  className={`py-2 px-3 rounded-lg transition-colors ${
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
                    <p className="text-2xl font-bold text-green-600">${selectedRestaurant.revenue?.toLocaleString() || 0}</p>
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
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Edit Restaurant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Restaurant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Restaurant</h3>
              <form onSubmit={handleAddRestaurant} className="space-y-4">
                <input
                  type="text"
                  placeholder="Restaurant Name"
                  value={newRestaurant.name}
                  onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Cuisine Type"
                  value={newRestaurant.cuisine}
                  onChange={(e) => setNewRestaurant({...newRestaurant, cuisine: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newRestaurant.address}
                  onChange={(e) => setNewRestaurant({...newRestaurant, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newRestaurant.phone}
                  onChange={(e) => setNewRestaurant({...newRestaurant, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={newRestaurant.description}
                  onChange={(e) => setNewRestaurant({...newRestaurant, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows={3}
                />
                <input
                  type="url"
                  placeholder="Image URL"
                  value={newRestaurant.image}
                  onChange={(e) => setNewRestaurant({...newRestaurant, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <input
                  type="text"
                  placeholder="Admin ID (e.g., PP004)"
                  value={newRestaurant.admin_id}
                  onChange={(e) => setNewRestaurant({...newRestaurant, admin_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Admin Password"
                  value={newRestaurant.admin_password}
                  onChange={(e) => setNewRestaurant({...newRestaurant, admin_password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Add Restaurant
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminRestaurants;