import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerData } from '../context/CustomerDataContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useNotification } from '../context/NotificationContext';
import { CreditCard, Lock, CheckCircle, ArrowLeft } from 'lucide-react';

const PaymentView = () => {
  const navigate = useNavigate();
  const { clearCart } = useCustomerData();
  const { apiCall } = useCustomerAuth();
  const { addNotification } = useNotification();
  
  const [orderData, setOrderData] = useState(null);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const storedOrderData = localStorage.getItem('orderData');
    if (storedOrderData) {
      setOrderData(JSON.parse(storedOrderData));
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      setPaymentData(prev => ({ ...prev, [name]: formatCardNumber(value) }));
    } else if (name === 'expiryDate') {
      setPaymentData(prev => ({ ...prev, [name]: formatExpiryDate(value) }));
    } else if (name === 'cvv') {
      setPaymentData(prev => ({ ...prev, [name]: value.replace(/\D/g, '').substring(0, 4) }));
    } else if (name.startsWith('billing.')) {
      const field = name.split('.')[1];
      setPaymentData(prev => ({
        ...prev,
        billingAddress: { ...prev.billingAddress, [field]: value }
      }));
    } else {
      setPaymentData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Create order in backend
      const orderItems = orderData.items.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
      }));

      const requestBody = {
        restaurantId: orderData.restaurant.id,
        orderType: orderData.orderDetails.orderType,
        items: orderItems,
        totalAmount: orderData.pricing.total
      };

      // Only include scheduledTime if it's not empty
      if (orderData.orderDetails.scheduledTime) {
        requestBody.scheduledTime = orderData.orderDetails.scheduledTime;
      }

      // Only include specialInstructions if it's not empty
      if (orderData.orderDetails.specialInstructions) {
        requestBody.specialInstructions = orderData.orderDetails.specialInstructions;
      }

      const result = await apiCall('/orders', {
        method: 'POST',
        body: requestBody
      });

      if (result && result.success) {
        setIsProcessing(false);
        setPaymentSuccess(true);
        clearCart();
        localStorage.removeItem('orderData');
        addNotification('Payment successful! Order confirmed.', 'success');
        
        // Redirect to dashboard after success
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        throw new Error(result?.message || 'Order creation failed');
      }
    } catch (error) {
      setIsProcessing(false);
      addNotification('Payment failed: ' + error.message, 'error');
    }
  };

  if (!orderData) {
    return <div>Loading...</div>;
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your order has been confirmed and will be prepared shortly.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Order Total:</strong> ₹{orderData.pricing.total.toFixed(2)}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Restaurant:</strong> {orderData.restaurant.name}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Order Type:</strong> {orderData.orderDetails.orderType}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            You'll be redirected to the dashboard shortly...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Lock className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold">Secure Payment</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={paymentData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={paymentData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    value={paymentData.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                <input
                  type="text"
                  name="cardholderName"
                  value={paymentData.cardholderName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="billing.street"
                    value={paymentData.billingAddress.street}
                    onChange={handleInputChange}
                    placeholder="Street Address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="billing.city"
                      value={paymentData.billingAddress.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="text"
                      name="billing.state"
                      value={paymentData.billingAddress.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    name="billing.zipCode"
                    value={paymentData.billingAddress.zipCode}
                    onChange={handleInputChange}
                    placeholder="ZIP Code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Pay ₹{orderData.pricing.total.toFixed(2)}</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Lock className="w-4 h-4" />
                <span>Secure SSL Encryption</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
            
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">{orderData.restaurant.name}</h4>
              <p className="text-sm text-gray-600">{orderData.restaurant.address}</p>
              <p className="text-sm text-gray-600 capitalize">
                {orderData.orderDetails.orderType} Order
              </p>
              {orderData.orderDetails.scheduledTime && (
                <p className="text-sm text-gray-600">
                  Scheduled: {new Date(orderData.orderDetails.scheduledTime).toLocaleString()}
                </p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{orderData.pricing.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>₹{orderData.pricing.tax.toFixed(2)}</span>
              </div>
              {orderData.pricing.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>₹{orderData.pricing.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{orderData.pricing.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {orderData.orderDetails.specialInstructions && (
              <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Special Instructions:</p>
                <p className="text-sm text-gray-600">{orderData.orderDetails.specialInstructions}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentView;