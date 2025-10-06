import React, { useState } from 'react';
import { Calendar, Clock, Users, ArrowLeft, Check, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';


function App() {
  const [showTableCards, setShowTableCards] = useState(true); // Start with table cards view
  const [selectedTable, setSelectedTable] = useState(null);
  const [showImageView, setShowImageView] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tables, setTables] = useState([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { apiCall } = useCustomerAuth();
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    guests: 2,
    specialRequests: ''
  });

  // Load tables from backend
  React.useEffect(() => {
    loadTables();
  }, [id]); // Only re-run when restaurant ID changes

  const loadTables = async () => {
    setIsLoadingPhotos(true);
    try {
      const result = await apiCall(`/restaurants/${id}/tables`);
      
      if (result && result.success) {
        setTables(result.data || []);
      } else if (Array.isArray(result)) {
        // Handle direct array response
        setTables(result);
      } else {
        console.warn('Unexpected tables response format:', result);
        setTables([]);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
      // Don't clear existing tables on error
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  // Auto-refresh tables data
  React.useEffect(() => {
    if (id) {
      const interval = setInterval(() => {
        loadTables();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [id]);

  // Convert backend table data to display format
  const getTableDisplayData = (table) => {
    const typeNames = {
      couple: "Couple Table",
      family: "Family Table", 
      group: "Large Group Table",
      private: "Private Dining",
      outdoor: "Outdoor Seating",
      bar: "Bar Seating",
      standard: "Standard Table"
    };

    const minSpends = {
      couple: "₹2000",
      family: "₹3200",
      group: "₹4800",
      private: "₹6400",
      outdoor: "₹2400",
      bar: "₹1600",
      standard: "₹2400"
    };

    const descriptions = {
      couple: "Perfect for intimate dining with romantic ambiance",
      family: "Spacious seating ideal for family gatherings",
      group: "Large table perfect for group celebrations",
      private: "Exclusive private dining experience",
      outdoor: "Fresh air dining with garden views",
      bar: "Casual seating at our premium bar",
      standard: "Comfortable seating for your dining experience"
    };

    const features = table.features ? table.features.split(',').map(f => f.trim()) : [];
    const gallery = table.images?.map(img => `http://localhost:5000${img.image_path}`) || [];
    const primaryImage = gallery.find((_, index) => table.images?.[index]?.is_primary) || 
                        gallery[0] || 
                        "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg";

    return {
      id: table.id,
      name: typeNames[table.type] || table.type,
      type: table.type,
      capacity: table.capacity,
      description: descriptions[table.type] || "Comfortable seating for your dining experience",
      image: primaryImage,
      minSpend: minSpends[table.type] || "$30",
      features: features.length > 0 ? features : ["Comfortable seating", "Great ambiance"],
      availableSlots: ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"],
      gallery: gallery,
      table_number: table.table_number,
      status: table.status
    };
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setCurrentImageIndex(0); // Reset to first image when selecting a new table
    setShowImageView(true);
    setBookingData(prev => ({ ...prev, guests: table.capacity }));
  };

  const handleBackToTableCards = () => {
    setShowImageView(false);
    setSelectedTable(null);
    setCurrentImageIndex(0);
  };

  
  const handleBackToMain = () => {
   navigate('/dashboard'); 
  };

  // Image navigation functions - Fixed implementation
  const nextImage = () => {
    if (selectedTable && selectedTable.gallery && selectedTable.gallery.length > 0) {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % selectedTable.gallery.length;
        console.log('Next image:', nextIndex, 'of', selectedTable.gallery.length); // Debug log
        return nextIndex;
      });
    }
  };

  const prevImage = () => {
    if (selectedTable && selectedTable.gallery && selectedTable.gallery.length > 0) {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = prevIndex === 0 ? selectedTable.gallery.length - 1 : prevIndex - 1;
        console.log('Previous image:', nextIndex, 'of', selectedTable.gallery.length); // Debug log
        return nextIndex;
      });
    }
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedTable || !bookingData.date || !bookingData.time) {
      alert('Please fill in all required fields');
      return;
    }
    


    // Make actual booking API call
    try {
      const result = await apiCall('/bookings', {
        method: 'POST',
        body: {
          restaurantId: parseInt(id),
          tableId: selectedTable.id,
          date: bookingData.date,
          time: bookingData.time,
          guests: bookingData.guests,
          specialRequests: bookingData.specialRequests
        }
      });

      if (result && result.success) {
        alert(`Table booked successfully!\n\nTable: ${selectedTable.name}\nDate: ${bookingData.date}\nTime: ${bookingData.time}\nGuests: ${bookingData.guests}`);
          
        // Reset form and navigate back
        setShowTableCards(true);
        setShowImageView(false);
        setSelectedTable(null);
        setCurrentImageIndex(0);
        setBookingData({
          date: '',
          time: '',
          guests: 2,
          specialRequests: ''
        });
          
        // Refresh tables to update status
        loadTables();
      } else {
        alert('Failed to book table. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book table: ' + error.message);
    }
  };

  const handleBookingOld = async (e) => {
    e.preventDefault();
    if (!selectedTable || !bookingData.date || !bookingData.time) {
      alert('Please fill in all required fields');
      return;
    }
    


    // Make actual booking API call
    const result = await apiCall('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        restaurantId: parseInt(id),
        tableId: selectedTable.id,
        date: bookingData.date,
        time: bookingData.time,
        guests: bookingData.guests,
        specialRequests: bookingData.specialRequests
      })
    });

    if (result.success) {
      alert(`Table booked successfully!\n\nTable: ${selectedTable.name}\nDate: ${bookingData.date}\nTime: ${bookingData.time}\nGuests: ${bookingData.guests}`);
        
      // Reset form and navigate back
      setShowTableCards(true);
      setShowImageView(false);
      setSelectedTable(null);
      setCurrentImageIndex(0);
      setBookingData({
        date: '',
        time: '',
        guests: 2,
        specialRequests: ''
      });
        
      // Refresh tables to update status
      loadTables();
    }
  };

  // Choose Your Table View
  if (!showImageView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
       <header className="bg-white/90 backdrop-blur-md shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back Button on the left */}
            <button 
              onClick={handleBackToMain} 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors hover:bg-gray-100 px-2 py-1 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Centered Title */}
            <h1 className="text-lg font-semibold text-gray-900 text-center flex-1">
              Choose Your Table
            </h1>

            {/* Empty right spacer to balance layout */}
            <div className="w-20" />
          </div>
        </div>
      </header>


        <div className="px-4 py-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Perfect Table</h2>
            <p className="text-gray-600 text-sm">Choose from our carefully curated seating options</p>
          </div>
          
          {isLoadingPhotos ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tables...</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tables available</h3>
              <p className="text-gray-500">Tables will appear here when the restaurant admin adds them.</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 px-2 snap-x snap-mandatory scroll-smooth">
              {tables.filter(table => table.status === 'available').map((table) => {
                const displayTable = getTableDisplayData(table);
                return (
                  <div 
                    key={table.id} 
                    className="flex-none w-72 bg-white rounded-2xl shadow-lg border overflow-hidden snap-center cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    onClick={() => handleTableSelect(displayTable)}
                  >
                    <div className="relative h-48">
                      <img
                        src={displayTable.image}
                        alt={displayTable.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                        <span className="text-xs font-semibold text-green-600">{displayTable.minSpend}</span>
                      </div>
                      <div className="absolute bottom-3 left-3 text-white">
                        <h3 className="text-lg font-bold drop-shadow-lg">{displayTable.name}</h3>
                        <p className="text-sm opacity-90 drop-shadow-md">Table #{displayTable.table_number}</p>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{displayTable.description}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>Up to {displayTable.capacity} guests</span>
                        </div>
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                          Available
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {displayTable.features.slice(0, 2).map((feature, index) => (
                          <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {feature}
                          </span>
                        ))}
                        {displayTable.features.length > 2 && (
                          <span className="text-xs text-gray-500">+{displayTable.features.length - 2} more</span>
                        )}
                      </div>
                      
                      <button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-2 px-4 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all duration-300 font-medium">
                        Select Table
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Table Detail and Booking View with Working Image Slider
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleBackToTableCards} 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors hover:bg-gray-100 px-2 py-1 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{selectedTable?.name}</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Image Slider Section */}
        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
          <div className="relative">
            {/* Main Image Container with improved aspect ratio */}
            <div className="relative h-64 sm:h-72 md:h-80 overflow-hidden bg-gray-100">
              <img
                src={selectedTable?.gallery?.[currentImageIndex] || selectedTable?.image}
                alt={`${selectedTable?.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-contain transition-all duration-500 ease-in-out"    
                style={{ objectPosition: 'center' }}
              />
              
              {/* Enhanced gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10"></div>
            </div>
            
            {/* Navigation Buttons with improved styling */}
            {selectedTable?.gallery && selectedTable.gallery.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl z-20 border border-white/20"
                  type="button"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl z-20 border border-white/20"
                  type="button"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            
            {/* Enhanced Image Counter */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium border border-white/20">
              {currentImageIndex + 1} / {selectedTable?.gallery?.length || 0}
            </div>
            
            {/* Enhanced Image Indicator Dots */}
            {selectedTable?.gallery && selectedTable.gallery.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full">
                {selectedTable.gallery.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      index === currentImageIndex 
                        ? 'bg-white scale-125' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    type="button"
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
            
            {/* Table Info Overlay */}
            <div className="absolute bottom-4 left-4 right-20 text-white">
              <h2 className="text-xl font-bold mb-1 drop-shadow-lg">{selectedTable?.name}</h2>
              <p className="text-white/90 text-sm drop-shadow-md">{selectedTable?.description}</p>
              <p className="text-white/80 text-xs drop-shadow-md">Table #{selectedTable?.table_number}</p>
            </div>
          </div>
        </div>

        {/* Table Features */}
        <div className="bg-white rounded-2xl shadow-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Table Features</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-amber-600" />
              <span className="text-gray-700">Up to {selectedTable?.capacity} guests</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600 font-semibold">{selectedTable?.minSpend} min spend</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTable?.features.map((feature, index) => (
              <span key={index} className="bg-amber-100 text-amber-800 text-sm px-3 py-1.5 rounded-full font-medium">
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-2xl shadow-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Make Your Reservation</h3>
          <form onSubmit={handleBooking} className="space-y-4">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Select Date
              </label>
              <input
                type="date"
                value={bookingData.date}
                onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Select Time
              </label>
              <select
                value={bookingData.time}
                onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="">Choose a time slot</option>
                {selectedTable?.availableSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            {/* Guest Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Number of Guests
              </label>
              <select
                value={bookingData.guests}
                onChange={(e) => setBookingData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
              >
                {Array.from({ length: selectedTable?.capacity || 2 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                ))}
              </select>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                value={bookingData.specialRequests}
                onChange={(e) => setBookingData(prev => ({ ...prev, specialRequests: e.target.value }))}
                placeholder="Any special requirements or dietary restrictions..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>
          </form>
        </div>

        {/* Booking Summary */}
        {bookingData.date && bookingData.time && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Table Type:</span>
                <span className="font-medium">{selectedTable?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Table Number:</span>
                <span className="font-medium">#{selectedTable?.table_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capacity:</span>
                <span className="font-medium">{selectedTable?.capacity} guests</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time:</span>
                <span className="font-medium">{bookingData.date} at {bookingData.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Party Size:</span>
                <span className="font-medium">{bookingData.guests} guests</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Minimum Spend:</span>
                <span className="font-medium text-green-600">{selectedTable?.minSpend}</span>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Booking Button */}
        <button
          onClick={handleBooking}
          disabled={!bookingData.date || !bookingData.time}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 px-6 rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2 transform hover:scale-105 active:scale-95"
        >
          <Check className="w-5 h-5" />
          <span>Confirm Booking</span>
        </button>
      </div>
    </div>
  );
}

export default App;