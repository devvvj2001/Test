import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCustomerData } from '../context/CustomerDataContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useNotification } from '../context/NotificationContext';
import { ArrowLeft, Plus, Minus, ShoppingCart, Star, Leaf, Heart, Filter } from 'lucide-react';

const MenuView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { restaurants, addToCart, cart } = useCustomerData();
  const { apiCall } = useCustomerAuth();
  const { addNotification } = useNotification();
  
  const [menuItems, setMenuItems] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDietary, setSelectedDietary] = useState('all');
  const [itemQuantities, setItemQuantities] = useState({});

  React.useEffect(() => {
    if (id) {
      loadRestaurant();
      loadMenu();
    }
  }, [id]);

  const loadRestaurant = async () => {
    try {
      const result = await apiCall(`/restaurants/${id}`);
      if (result && result.success) {
        setRestaurant(result.data);
      } else if (result && result.id) {
        // Handle direct restaurant object response
        setRestaurant(result);
      }
    } catch (error) {
      console.error('Failed to load restaurant:', error);
      // Fallback to local data
      const localRestaurant = restaurants.find(r => r.id === parseInt(id));
      setRestaurant(localRestaurant);
    }
  };

  const loadMenu = async () => {
    setIsLoadingMenu(true);
    try {
      const result = await apiCall(`/restaurants/${id}/menu`);
      if (result && result.success) {
        setMenuItems(result.data || []);
      } else if (Array.isArray(result)) {
        // Handle direct array response
        setMenuItems(result);
      } else {
        console.warn('Unexpected menu response format:', result);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Failed to load menu:', error);
      addNotification('Failed to load menu', 'error');
      // Don't clear existing menu items on error
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Refresh menu data periodically
  React.useEffect(() => {
    if (id) {
      const interval = setInterval(() => {
        loadMenu();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [id]);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  const dietaryOptions = ['all', 'vegetarian', 'gluten-free', 'healthy'];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesDietary = selectedDietary === 'all' || (item.dietary && item.dietary.includes(selectedDietary));
    return matchesCategory && matchesDietary;
  });

  const updateQuantity = (itemId, change) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + change)
    }));
  };

  const handleAddToCart = (item) => {
    const quantity = itemQuantities[item.id] || 1;
    for (let i = 0; i < quantity; i++) {
      addToCart(item, restaurant.id);
    }
    addNotification(`Added ${quantity}x ${item.name} to cart`, 'success');
    setItemQuantities(prev => ({ ...prev, [item.id]: 0 }));
  };

  const totalCartItems = cart.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-2 sm:space-y-0">
            <Link to="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm md:text-base">Back to Dashboard</span>
            </Link>
            
            {totalCartItems > 0 && (
              <Link
                to={`/restaurant/${id}/preorder`}
                className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-300 text-sm md:text-base"
              >
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                <span>Cart ({totalCartItems})</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Restaurant Header */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-slate-900 to-slate-700">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-4 md:bottom-6 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{restaurant.name}</h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm md:text-base text-white/90">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-current" />
                <span>{restaurant.rating}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <span>{restaurant.cuisine}</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">{restaurant.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b sticky top-16 md:top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 font-medium text-sm md:text-base">Categories:</span>
              <div className="flex space-x-2 overflow-x-auto">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All Categories' : category}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-700 font-medium text-sm md:text-base">Dietary:</span>
              <div className="flex space-x-2 overflow-x-auto">
                {dietaryOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => setSelectedDietary(option)}
                    className={`px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedDietary === option
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option === 'all' ? 'All Options' : option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {isLoadingMenu ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading menu...</p>
          </div>
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 md:hover:-translate-y-2">
              {item.chef_special && (
                <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-center py-2 text-xs md:text-sm font-medium">
                  🌟 Chef's Special
                </div>
              )}
              
              <div className="relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-40 md:h-48 object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                  <span className="font-bold text-green-600">₹{item.price}</span>
                </div>
                
                {item.dietary && (
                  <div className="absolute bottom-4 left-4 flex space-x-2">
                    {item.dietary.split(',').map(diet => diet.trim()).includes('vegetarian') && (
                      <div className="bg-green-500 text-white p-1 rounded-full" title="Vegetarian">
                        <Leaf className="w-3 h-3" />
                      </div>
                    )}
                    {item.dietary.split(',').map(diet => diet.trim()).includes('gluten-free') && (
                      <div className="bg-blue-500 text-white p-1 rounded-full text-xs font-bold" title="Gluten Free">
                        GF
                      </div>
                    )}
                    {item.dietary.split(',').map(diet => diet.trim()).includes('healthy') && (
                      <div className="bg-pink-500 text-white p-1 rounded-full" title="Healthy">
                        <Heart className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-gray-600 mb-4 text-xs md:text-sm leading-relaxed line-clamp-2">{item.description}</p>
                
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                      disabled={!itemQuantities[item.id]}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 md:w-8 text-center font-semibold text-sm md:text-base">
                      {itemQuantities[item.id] || 0}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={!itemQuantities[item.id]}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
        
        {!isLoadingMenu && filteredItems.length === 0 && (
          <div className="text-center py-8 md:py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 text-sm md:text-base">
              {menuItems.length === 0 
                ? 'No menu items available yet. The restaurant admin needs to add menu items.'
                : 'Try adjusting your category or dietary filters'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuView;