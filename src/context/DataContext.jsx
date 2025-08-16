import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Menu data
const mockMenuItems = {
  1: [
    {
      id: 1,
      name: "Wagyu Beef Tenderloin",
      category: "Mains",
      price: 89.99,
      description: "Premium wagyu beef with truffle sauce and seasonal vegetables",
      image: "https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg",
      dietary: ["gluten-free"],
      chef_special: true,
      available: true
    },
    {
      id: 2,
      name: "Pan-Seared Salmon",
      category: "Mains",
      price: 32.99,
      description: "Fresh Atlantic salmon with lemon herb butter and quinoa",
      image: "https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg",
      dietary: ["gluten-free", "healthy"],
      available: true
    },
    {
      id: 3,
      name: "Truffle Arancini",
      category: "Starters",
      price: 18.99,
      description: "Crispy risotto balls with black truffle and parmesan",
      image: "https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg",
      dietary: ["vegetarian"],
      available: true
    },
    {
      id: 4,
      name: "Lobster Thermidor",
      category: "Mains",
      price: 65.99,
      description: "Fresh lobster with creamy cognac sauce and herbs",
      image: "https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg",
      dietary: ["gluten-free"],
      available: true
    },
    {
      id: 5,
      name: "Chocolate Soufflé",
      category: "Desserts",
      price: 16.99,
      description: "Warm chocolate soufflé with vanilla ice cream",
      image: "https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg",
      dietary: ["vegetarian"],
      available: true
    }
  ],
  2: [
    {
      id: 6,
      name: "Sashimi Platter",
      category: "Sashimi",
      price: 45.99,
      description: "Fresh selection of tuna, salmon, and yellowtail",
      image: "https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg",
      dietary: ["gluten-free", "healthy"],
      available: true
    },
    {
      id: 7,
      name: "Dragon Roll",
      category: "Sushi",
      price: 18.99,
      description: "Eel and cucumber topped with avocado and eel sauce",
      image: "https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg",
      available: true
    },
    {
      id: 8,
      name: "Miso Soup",
      category: "Starters",
      price: 6.99,
      description: "Traditional soybean paste soup with tofu and seaweed",
      image: "https://images.pexels.com/photos/5409751/pexels-photo-5409751.jpeg",
      dietary: ["vegetarian", "healthy"],
      available: true
    }
  ],
  3: [
    {
      id: 9,
      name: "Margherita Pizza",
      category: "Pizza",
      price: 22.99,
      description: "Fresh mozzarella, tomato sauce, and basil",
      image: "https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg",
      dietary: ["vegetarian"],
      available: true
    },
    {
      id: 10,
      name: "Fettuccine Alfredo",
      category: "Pasta",
      price: 19.99,
      description: "Creamy parmesan sauce with fresh fettuccine",
      image: "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg",
      dietary: ["vegetarian"],
      available: true
    },
    {
      id: 11,
      name: "Tiramisu",
      category: "Desserts",
      price: 12.99,
      description: "Classic Italian dessert with coffee and mascarpone",
      image: "https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg",
      dietary: ["vegetarian"],
      available: true
    }
  ]
};

export const DataProvider = ({ children }) => {
  const { apiCall } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load restaurants from API
  const loadRestaurants = async () => {
    setIsLoading(true);
    try {
      const result = await apiCall('/restaurants');
      if (result.success) {
        setRestaurants(result.data);
      }
    } catch (error) {
      console.error('Failed to load restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user orders
  const loadOrders = async () => {
    try {
      const result = await apiCall('/orders');
      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  // Load user bookings
  const loadBookings = async () => {
    try {
      const result = await apiCall('/bookings');
      if (result.success) {
        setBookings(result.data);
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };
  // Load restaurants on mount
  React.useEffect(() => {
    loadRestaurants();
  }, []);
  
  // Admin functionality
  const updateRestaurant = (restaurantId, updates) => {
    setRestaurants(prev => prev.map(restaurant => 
      restaurant.id === restaurantId ? { ...restaurant, ...updates } : restaurant
    ));
  };

  const addMenuItem = async (restaurantId, menuItem) => {
    try {
      const result = await apiCall('/admin/menu', {
        method: 'POST',
        body: menuItem
      });
      if (result.success) {
        // Refresh restaurants to update menu
        await loadRestaurants();
        return result;
      }
    } catch (error) {
      console.error('Failed to add menu item:', error);
      throw error;
    }
  };

  const updateMenuItem = async (restaurantId, itemId, updates) => {
    try {
      const result = await apiCall(`/admin/menu/${itemId}`, {
        method: 'PUT',
        body: updates
      });
      if (result.success) {
        await loadRestaurants();
        return result;
      }
    } catch (error) {
      console.error('Failed to update menu item:', error);
      throw error;
    }
  };

  const deleteMenuItem = async (restaurantId, itemId) => {
    try {
      const result = await apiCall(`/admin/menu/${itemId}`, {
        method: 'DELETE'
      });
      if (result.success) {
        await loadRestaurants();
        return result;
      }
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      throw error;
    }
  };

  const addToCart = (item, restaurantId) => {
    setCart(prev => [...prev, { ...item, restaurantId, id: Date.now() }]);
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const addBooking = async (bookingData) => {
    try {
      const result = await apiCall('/bookings', {
        method: 'POST',
        body: bookingData
      });
      if (result.success) {
        await loadBookings();
        await loadRestaurants(); // Refresh to update table status
        return result;
      }
    } catch (error) {
      console.error('Failed to add booking:', error);
      throw error;
    }
  };

  const createOrder = async (orderData) => {
    try {
      const result = await apiCall('/orders', {
        method: 'POST',
        body: orderData
      });
      if (result.success) {
        await loadOrders();
        return result;
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  };
  const updateTableStatus = (restaurantId, tableId, status) => {
    setRestaurants(prev => prev.map(restaurant => {
      if (restaurant.id === restaurantId) {
        return {
          ...restaurant,
          tables: restaurant.tables.map(table => 
            table.id === tableId ? { ...table, status } : table
          )
        };
      }
      return restaurant;
    }));
  };

  const getMenuItems = async (restaurantId) => {
    try {
      const result = await apiCall(`/restaurants/${restaurantId}/menu`);
      if (result.success) {
        return result.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get menu items:', error);
      return [];
    }
  };

  const value = {
    restaurants,
    isLoading,
    loadRestaurants,
    loadOrders,
    loadBookings,
    orders,
    bookings,
    cart,
    updateRestaurant,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addToCart,
    removeFromCart,
    clearCart,
    addBooking,
    createOrder,
    updateTableStatus,
    getMenuItems
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};