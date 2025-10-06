import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCustomerData } from '../context/CustomerDataContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useNotification } from '../context/NotificationContext';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingCart, Calendar, Clock } from 'lucide-react';

const PreOrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { restaurants, cart, removeFromCart, clearCart } = useCustomerData();
  const { apiCall } = useCustomerAuth();
  const { addNotification } = useNotification();
  
  const restaurant = restaurants.find(r => r.id === parseInt(id));
  const restaurantCartItems = cart.filter(item => item.restaurantId === parseInt(id));
  
  const [orderDetails, setOrderDetails] = useState({
    orderType: 'pickup',
    scheduledTime: '',
    specialInstructions: ''
  });

  if (!restaurant) {
    return <div>Restaurant not found</div>;
  }

  const groupedItems = restaurantCartItems.reduce((acc, item) => {
    const key = `${item.id}-${item.name}`;
    if (acc[key]) {
      acc[key].quantity += 1;
    } else {
      acc[key] = { ...item, quantity: 1 };
    }
    return acc;
  }, {});

  const groupedItemsArray = Object.values(groupedItems);
  const subtotal = groupedItemsArray.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const deliveryFee = orderDetails.orderType === 'delivery' ? 99 : 0;
  const total = subtotal + tax + deliveryFee;

  const handleQuantityChange = (item, change) => {
    if (change > 0) {
      // Add more items to cart
      for (let i = 0; i < change; i++) {
        // This would need to be implemented in DataContext
      }
    } else {
      // Remove items from cart
      for (let i = 0; i < Math.abs(change); i++) {
        const cartItem = cart.find(cartItem => cartItem.name === item.name && cartItem.restaurantId === parseInt(id));
        if (cartItem) {
          removeFromCart(cartItem.cartItemId);
        }
      }
    }
  };

  const handleProceedToPayment = () => {
    if (groupedItemsArray.length === 0) {
      addNotification('Your cart is empty', 'error');
      return;
    }

    const orderData = {
      restaurant,
      items: groupedItemsArray,
      orderDetails,
      pricing: { subtotal, tax, deliveryFee, total }
    };

    // Store order details in localStorage for payment page
    localStorage.setItem('orderData', JSON.stringify(orderData));

    navigate('/payment');
  };

  if (groupedItemsArray.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-4">
              <Link to={`/restaurant/${id}/menu`} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Menu</span>
              </Link>
            </div>
          </div>
        </header>
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Add some delicious items from the menu to get started!</p>
          <Link
            to={`/restaurant/${id}/menu`}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to={`/restaurant/${id}/menu`} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Menu</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <span className="font-semibold">Pre-Order from {restaurant.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Your Order</h2>
                <button
                  onClick={() => {
                    clearCart();
                    addNotification('Cart cleared', 'success');
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Clear All
                </button>
              </div>
              
              <div className="space-y-4">
                {groupedItemsArray.map((item) => (
                  <div key={`${item.id}-${item.name}`} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-green-600 font-medium">₹{item.price.toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange(item, -1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item, 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        // Remove all instances of this item
                        const itemsToRemove = cart.filter(cartItem =>
                          cartItem.name === item.name && cartItem.restaurantId === parseInt(id)
                        );
                        itemsToRemove.forEach(cartItem => removeFromCart(cartItem.cartItemId));
                        addNotification(`Removed ${item.name} from cart`, 'success');
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Options */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Order Options</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="orderType"
                        value="pickup"
                        checked={orderDetails.orderType === 'pickup'}
                        onChange={(e) => setOrderDetails(prev => ({ ...prev, orderType: e.target.value }))}
                        className="mr-2"
                      />
                      <span>Pickup</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="orderType"
                        value="delivery"
                        checked={orderDetails.orderType === 'delivery'}
                        onChange={(e) => setOrderDetails(prev => ({ ...prev, orderType: e.target.value }))}
                        className="mr-2"
                      />
                      <span>Delivery (+₹99)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Scheduled Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={orderDetails.scheduledTime}
                    onChange={(e) => setOrderDetails(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                  <textarea
                    value={orderDetails.specialInstructions}
                    onChange={(e) => setOrderDetails(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any special requests or modifications..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>₹{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              >
                Proceed to Payment
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Your order will be prepared according to your specifications
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreOrderView;