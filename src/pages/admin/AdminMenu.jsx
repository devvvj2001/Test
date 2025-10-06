import React, { useState, useEffect, useRef } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useNotification } from '../../context/NotificationContext';
import { apiCache } from '../../utils/apiCache';
import { ChefHat, Plus, CreditCard as Edit, Trash2, Search, Filter, Star, Eye, EyeOff, Table, Upload, Image as ImageIcon, X } from 'lucide-react';

const AdminMenu = () => {
  const { apiCall } = useAdminAuth();
  const { addNotification } = useNotification();
  
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const loadingMenuRef = useRef(false);
  const loadingTablesRef = useRef(false);
  const [newTable, setNewTable] = useState({
    table_number: '',
    capacity: 2,
    type: '',
    features: '',
    x_position: 0,
    y_position: 0
  });
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    image: '',
    dietary: '',
    chef_special: false
  });

  useEffect(() => {
    loadMenuItems();
    loadTables();
  }, []);

  useEffect(() => {
    filterItems();
  }, [menuItems, searchTerm, categoryFilter]);

  const loadMenuItems = async () => {
    if (loadingMenuRef.current) return;

    loadingMenuRef.current = true;

    try {
      const response = await apiCache.dedupe('/admin/menu', {}, async () => {
        return await apiCall('/admin/menu');
      });

      if (response && response.success) {
        setMenuItems(response.data);
      } else if (Array.isArray(response)) {
        setMenuItems(response);
      } else {
        console.warn('Unexpected menu response format:', response);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Failed to load menu items:', error);
      addNotification('Failed to load menu items from server', 'error');
    } finally {
      loadingMenuRef.current = false;
    }
  };

  const loadTables = async () => {
    if (loadingTablesRef.current) return;

    loadingTablesRef.current = true;

    try {
      const response = await apiCache.dedupe('/admin/tables', {}, async () => {
        return await apiCall('/admin/tables');
      });

      if (response && response.success) {
        setTables(response.data);
      } else if (Array.isArray(response)) {
        setTables(response);
      } else {
        console.warn('Unexpected tables response format:', response);
        setTables([]);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
      addNotification('Failed to load tables from server', 'error');
    } finally {
      setIsLoading(false);
      loadingTablesRef.current = false;
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTable.table_number || !newTable.type) {
      addNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      const response = await apiCall('/admin/tables', {
        method: 'POST',
        body: {
          ...newTable,
          table_number: parseInt(newTable.table_number),
          capacity: parseInt(newTable.capacity)
        }
      });

      if (response.success) {
        addNotification('Table added successfully', 'success');
        setShowTableModal(false);
        setNewTable({
          table_number: '',
          capacity: 2,
          type: '',
          features: '',
          x_position: 0,
          y_position: 0
        });
        // Reload tables to get fresh data
        loadTables();
      }
    } catch (error) {
      addNotification(error.message || 'Failed to add table', 'error');
    }
  };

  const handleImageUpload = async (files) => {
    if (!selectedTable || !files || files.length === 0) {
      addNotification('Please select images to upload', 'error');
      return;
    }

    setUploadingImages(true);
    try {
      const formData = new FormData();
      
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      const response = await fetch(`http://localhost:5000/api/admin/tables/${selectedTable.id}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        addNotification(`${files.length} image(s) uploaded successfully`, 'success');
        setShowImageModal(false);
        // Reload tables to get fresh data
        loadTables();
      } else {
        addNotification(result.message || 'Failed to upload images', 'error');
      }
    } catch (error) {
      addNotification('Failed to upload images', 'error');
    } finally {
      setUploadingImages(false);
    }
  };

  const deleteTable = async (tableId) => {
    if (!confirm('Are you sure you want to delete this table? This action cannot be undone.')) return;

    try {
      const response = await apiCall(`/admin/tables/${tableId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        addNotification('Table deleted successfully', 'success');
        // Reload tables to get fresh data
        loadTables();
      }
    } catch (error) {
      addNotification(error.message || 'Failed to delete table', 'error');
    }
  };

  const deleteTableImage = async (tableId, imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await apiCall(`/admin/tables/${tableId}/images/${imageId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        addNotification('Image deleted successfully', 'success');
        // Reload tables to get fresh data
        loadTables();
      }
    } catch (error) {
      addNotification('Failed to delete image', 'error');
    }
  };

  const filterItems = () => {
    let filtered = [...menuItems];

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    setFilteredItems(filtered);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.category || !newItem.price) {
      addNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      const response = await apiCall('/admin/menu', {
        method: 'POST',
        body: {
          ...newItem,
          price: parseFloat(newItem.price)
        }
      });

      if (response.success) {
        addNotification('Menu item added successfully', 'success');
        setShowAddModal(false);
        // Reset form
        setNewItem({
          name: '',
          category: '',
          price: '',
          description: '',
          image: '',
          dietary: '',
          chef_special: false
        });
        // Reload menu items to get fresh data
        loadMenuItems();
      }
    } catch (error) {
      addNotification(error.message || 'Failed to add menu item', 'error');
    }
  };

  const handleUpdateItem = async (itemId, updates) => {
    try {
      const response = await apiCall(`/admin/menu/${itemId}`, {
        method: 'PUT',
        body: updates
      });

      if (response.success) {
        addNotification('Menu item updated successfully', 'success');
        setEditingItem(null);
        // Reload menu items to get fresh data
        loadMenuItems();
      }
    } catch (error) {
      addNotification(error.message || 'Failed to update menu item', 'error');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const response = await apiCall(`/admin/menu/${itemId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        addNotification('Menu item deleted successfully', 'success');
        // Reload menu items to get fresh data
        loadMenuItems();
      }
    } catch (error) {
      addNotification(error.message || 'Failed to delete menu item', 'error');
    }
  };

  const toggleAvailability = async (itemId, currentStatus) => {
    try {
      await handleUpdateItem(itemId, { available: !currentStatus });
    } catch (error) {
      addNotification('Failed to update item availability', 'error');
    }
  };

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];

  const cuisineTypes = [
    'Italian', 'Japanese', 'Chinese', 'Mexican', 'Indian', 'Thai', 'French', 
    'Mediterranean', 'American', 'Korean', 'Vietnamese', 'Greek', 'Spanish'
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">Manage your restaurant's menu items and pricing</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTableModal(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center space-x-2"
          >
            <Table className="w-5 h-5" />
            <span>Add Table</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Tables Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Restaurant Tables</h2>
          <span className="text-sm text-gray-500">Total Tables: {tables.length}</span>
        </div>
        
        {tables.length === 0 ? (
          <div className="text-center py-8">
            <Table className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tables created yet</h3>
            <p className="text-gray-500">Create your first table to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
              <div key={table.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={table.thumbnail_image ? `http://localhost:5000${table.thumbnail_image}` : 'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg'}
                    alt={`Table ${table.table_number}`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      table.status === 'available' ? 'bg-green-100 text-green-800' :
                      table.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                      table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {table.status}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">Table {table.table_number}</h3>
                    <span className="text-sm text-gray-500">{table.capacity} guests</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 capitalize">{table.type}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {table.image_count || 0} photos
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTable(table);
                          setShowImageModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Manage images"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTable(table.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete table"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {menuItems.length > 0 && [...new Set(menuItems.map(item => item.category))].map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            {item.chef_special && (
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-center py-2 text-sm font-medium">
                <Star className="w-4 h-4 inline mr-1" />
                Chef's Special
              </div>
            )}
            
            <div className="relative">
              <img
                src={item.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="font-bold text-green-600">₹{item.price}</span>
              </div>
              
              <div className="absolute bottom-4 left-4">
                <button
                  onClick={() => toggleAvailability(item.id, item.available)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                    item.available 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {item.available ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{item.available ? 'Available' : 'Hidden'}</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {item.category}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
              
              {item.dietary && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {item.dietary.split(',').map((diet, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {diet.trim()}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-500">Updated</p>
                  <p className="text-xs text-gray-400">
                    {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
          <p className="text-gray-500">No items match your current filters.</p>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Menu Item</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <input
                  type="text"
                  placeholder="Item Name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Starters">Starters</option>
                  <option value="Mains">Mains</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Pizza">Pizza</option>
                  <option value="Pasta">Pasta</option>
                  <option value="Sushi">Sushi</option>
                  <option value="Sashimi">Sashimi</option>
                  <option value="Noodles">Noodles</option>
                  <option value="Salads">Salads</option>
                  <option value="Soups">Soups</option>
                </select>
                <select
                  value={newItem.cuisine || ''}
                  onChange={(e) => setNewItem({...newItem, cuisine: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Cuisine Type</option>
                  {cuisineTypes.map(cuisine => (
                    <option key={cuisine} value={cuisine}>{cuisine}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Image</label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setNewItem({...newItem, image: e.target.result});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="url"
                      placeholder="Or enter image URL"
                      value={newItem.image}
                      onChange={(e) => setNewItem({...newItem, image: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {newItem.image && (
                      <div className="mt-2">
                        <img
                          src={newItem.image}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Dietary Info (comma separated)"
                  value={newItem.dietary}
                  onChange={(e) => setNewItem({...newItem, dietary: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chef_special"
                    checked={newItem.chef_special}
                    onChange={(e) => setNewItem({...newItem, chef_special: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="chef_special" className="text-sm text-gray-700">Chef's Special</label>
                </div>
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Menu Item</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdateItem(editingItem.id, editingItem);
              }} className="space-y-4">
                <input
                  type="text"
                  placeholder="Item Name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Starters">Starters</option>
                  <option value="Mains">Mains</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Pizza">Pizza</option>
                  <option value="Pasta">Pasta</option>
                  <option value="Sushi">Sushi</option>
                  <option value="Sashimi">Sashimi</option>
                  <option value="Noodles">Noodles</option>
                  <option value="Salads">Salads</option>
                  <option value="Soups">Soups</option>
                </select>
                <select
                  value={editingItem.cuisine || ''}
                  onChange={(e) => setEditingItem({...editingItem, cuisine: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Cuisine Type</option>
                  {cuisineTypes.map(cuisine => (
                    <option key={cuisine} value={cuisine}>{cuisine}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Image</label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setEditingItem({...editingItem, image: e.target.result});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="url"
                      placeholder="Or enter image URL"
                      value={editingItem.image}
                      onChange={(e) => setEditingItem({...editingItem, image: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {editingItem.image && (
                      <div className="mt-2">
                        <img
                          src={editingItem.image}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Dietary Info (comma separated)"
                  value={editingItem.dietary}
                  onChange={(e) => setEditingItem({...editingItem, dietary: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit_chef_special"
                    checked={editingItem.chef_special}
                    onChange={(e) => setEditingItem({...editingItem, chef_special: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="edit_chef_special" className="text-sm text-gray-700">Chef's Special</label>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Table</h3>
              <form onSubmit={handleAddTable} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Table Number *</label>
                    <input
                      type="number"
                      min="1"
                      value={newTable.table_number}
                      onChange={(e) => setNewTable({...newTable, table_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacity *</label>
                    <select
                      value={newTable.capacity}
                      onChange={(e) => setNewTable({...newTable, capacity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value={2}>2 guests</option>
                      <option value={4}>4 guests</option>
                      <option value={6}>6 guests</option>
                      <option value={8}>8 guests</option>
                      <option value={10}>10 guests</option>
                      <option value={12}>12 guests</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Table Type *</label>
                  <select
                    value={newTable.type}
                    onChange={(e) => setNewTable({...newTable, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select table type</option>
                    <option value="couple">Couple Table</option>
                    <option value="family">Family Table</option>
                    <option value="group">Large Group Table</option>
                    <option value="private">Private Dining</option>
                    <option value="outdoor">Outdoor Seating</option>
                    <option value="bar">Bar Seating</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                  <textarea
                    value={newTable.features}
                    onChange={(e) => setNewTable({...newTable, features: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="WiFi, Window view, Power outlets, etc."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowTableModal(false)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add Table
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Table Images Modal */}
      {showImageModal && selectedTable && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Images - Table {selectedTable.table_number}
                </h3>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Upload Form */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-4">Upload New Images</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Images</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        if (files.length > 0) {
                          handleImageUpload(files);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">You can select multiple images at once. First image will be the thumbnail.</p>
                  </div>
                  {uploadingImages && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-blue-600">Uploading images...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Existing Images */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Current Images ({selectedTable.images?.length || 0})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {selectedTable.images?.map((image, index) => (
                    <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden relative">
                      <img
                        src={`http://localhost:5000${image.image_path}`}
                        alt={`Table ${selectedTable.table_number} - Image ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      {image.is_primary && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                          Primary
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => deleteTableImage(selectedTable.id, image.id)}
                          className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="p-3">
                        {image.description && (
                          <p className="text-sm text-gray-600 mb-2">{image.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Uploaded: {new Date(image.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )) || []}
                </div>
                
                {(!selectedTable.images || selectedTable.images.length === 0) && (
                  <div className="text-center py-8">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No images uploaded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenu; 