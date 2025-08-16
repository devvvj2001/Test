import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Star, MapPin, Clock, Users, ChefHat, Search, Filter, Heart, Calendar } from 'lucide-react';
import AIChat from '../components/AIChat';
import NotificationToast from '../components/NotificationToast';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const { restaurants, isLoading: restaurantsLoading, loadRestaurants, loadOrders, loadBookings } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [favorites, setFavorites] = useState([]);

  // Refresh restaurants data periodically
  React.useEffect(() => {
    // Load initial data
    loadOrders();
    loadBookings();
    
    const interval = setInterval(loadRestaurants, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadRestaurants]);

  const cuisines = ['all', 'Fine Dining', 'Japanese', 'Italian', 'Indian', 'Mexican'];

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = selectedCuisine === 'all' || restaurant.cuisine === selectedCuisine;
    return matchesSearch && matchesCuisine;
  });

  const toggleFavorite = (restaurantId) => {
    setFavorites(prev => 
      prev.includes(restaurantId) 
        ? prev.filter(id => id !== restaurantId)
        : [...prev, restaurantId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationToast />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <ChefHat className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                <span className="text-lg md:text-2xl font-bold text-gray-900">RestaurantAI</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold text-gray-900">{user?.name}</p>
              </div>
              <div className="sm:hidden">
                <p className="text-sm font-semibold text-gray-900">Hi, {user?.name}</p>
              </div>
              <button
                onClick={logout}
                className="px-3 py-2 md:px-4 md:py-2 text-red-600 hover:text-red-800 transition-colors text-sm md:text-base"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Discover Amazing Restaurants
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 md:mb-8 max-w-2xl mx-auto">
            Book tables, explore menus, and enjoy personalized dining experiences powered by AI
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
              <input
                type="text"
                placeholder="Search restaurants, cuisines, or dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 md:pl-12 md:pr-4 md:py-4 rounded-lg text-gray-900 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-sm md:text-base"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 font-medium">Filter by cuisine:</span>
            </div>
            <div className="flex space-x-2 overflow-x-auto w-full sm:w-auto">
              {cuisines.map(cuisine => (
                <button
                  key={cuisine}
                  onClick={() => setSelectedCuisine(cuisine)}
                  className={`px-3 py-2 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedCuisine === cuisine
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cuisine === 'all' ? 'All Cuisines' : cuisine}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Restaurants Grid */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {filteredRestaurants.map(restaurant => (
              <div key={restaurant.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 md:hover:-translate-y-2">
                <div className="relative">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-40 md:h-48 object-cover"
                  />
                  <button
                    onClick={() => toggleFavorite(restaurant.id)}
                    className={`absolute top-3 right-3 md:top-4 md:right-4 p-2 rounded-full backdrop-blur-sm transition-colors ${
                      favorites.includes(restaurant.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    <Heart className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-white/90 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1 rounded-full">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 fill-current" />
                      <span className="text-xs md:text-sm font-semibold">{restaurant.rating}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 md:p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate pr-2">{restaurant.name}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full whitespace-nowrap">
                      {restaurant.cuisine}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 text-sm md:text-base line-clamp-2">{restaurant.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                      <span>2.5 km away</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 md:w-4 md:h-4" />
                      <span>30-45 min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3 md:w-4 md:h-4" />
                      <span>{restaurant.available_tables || 0} available</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <Link
                      to={`/restaurant/${restaurant.id}/booking`}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-3 md:px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-center font-medium flex items-center justify-center space-x-2 text-sm md:text-base"
                    >
                      <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                      <span>Book Table</span>
                    </Link>
                    <Link
                      to={`/restaurant/${restaurant.id}/menu`}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 md:px-4 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium text-sm md:text-base"
                    >
                      View Menu
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {!restaurantsLoading && filteredRestaurants.length === 0 && (
            <div className="text-center py-8 md:py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No restaurants found</h3>
              <p className="text-gray-600 text-sm md:text-base">Try adjusting your search criteria or filters</p>
            </div>
          )}
          
          {restaurantsLoading && (
            <div className="text-center py-8 md:py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading restaurants...</p>
            </div>
          )}
        </div>
      </section>

      {/* AI Chat */}
      <AIChat />
    </div>
  );
};

export default CustomerDashboard;