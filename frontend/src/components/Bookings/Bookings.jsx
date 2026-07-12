import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Monitor, Car, Briefcase } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [reservableAssets, setReservableAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([]); // Array of selected hours (e.g., [9, 10, 11])
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const { showToast } = useToast();

  // Define 1-hour slots from 8:00 to 18:00
  const SLOTS = Array.from({length: 10}, (_, i) => i + 8);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [bookingsRes, assetsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/allocations/bookings/`, { headers }),
        fetch(`http://localhost:8000/api/assets/assets/?status=Available`, { headers }) 
      ]);
      
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (assetsRes.ok) {
        const assets = await assetsRes.json();
        const reservables = assets.filter(a => ['Vehicles', 'Projectors', 'Furniture'].includes(a.category_name));
        setReservableAssets(reservables);
      }
    } catch (err) {
      console.error('Failed to fetch bookings data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When asset or date changes, reset selected slots
  useEffect(() => {
    setSelectedSlots([]);
  }, [selectedAsset, selectedDate]);

  const getSlotStatus = (hour) => {
    if (!selectedAsset || !selectedDate) return 'disabled';
    
    // Create Date objects for slot start and end in local time
    const slotStart = new Date(`${selectedDate}T${String(hour).padStart(2, '0')}:00:00`);
    const slotEnd = new Date(`${selectedDate}T${String(hour+1).padStart(2, '0')}:00:00`);

    // Check overlaps against fetched bookings
    const assetBookings = bookings.filter(b => b.asset_details?.id === parseInt(selectedAsset));
    
    const isBooked = assetBookings.some(b => {
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      return bStart < slotEnd && bEnd > slotStart;
    });

    if (isBooked) return 'booked';
    if (selectedSlots.includes(hour)) return 'selected';
    return 'free';
  };

  const handleSlotClick = (hour) => {
    const status = getSlotStatus(hour);
    if (status === 'booked' || status === 'disabled') return;

    if (selectedSlots.length === 0) {
      setSelectedSlots([hour]);
    } else {
      const firstSelected = selectedSlots[0];
      const start = Math.min(firstSelected, hour);
      const end = Math.max(firstSelected, hour);
      
      // Check if any slot in the range is booked
      let rangeValid = true;
      for (let h = start; h <= end; h++) {
        if (getSlotStatus(h) === 'booked') {
          rangeValid = false;
          break;
        }
      }

      if (rangeValid) {
        const newSlots = [];
        for (let h = start; h <= end; h++) newSlots.push(h);
        setSelectedSlots(newSlots);
      } else {
        // If invalid range, just select the clicked slot
        setSelectedSlots([hour]);
      }
    }
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    setError('');
    
    if (selectedSlots.length === 0) {
      setError('Please select at least one time slot.');
      return;
    }

    const startHour = Math.min(...selectedSlots);
    const endHour = Math.max(...selectedSlots) + 1; // End time is the end of the last slot

    // Create local Date objects and convert to ISO string (UTC)
    const startDateObj = new Date(`${selectedDate}T${String(startHour).padStart(2, '0')}:00:00`);
    const endDateObj = new Date(`${selectedDate}T${String(endHour).padStart(2, '0')}:00:00`);

    const startTime = startDateObj.toISOString();
    const endTime = endDateObj.toISOString();

    try {
      const res = await fetch(`http://localhost:8000/api/allocations/bookings/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset: selectedAsset,
          start_time: startTime,
          end_time: endTime,
          purpose: purpose
        })
      });
      
      if (res.ok) {
        setShowForm(false);
        setSelectedAsset('');
        setSelectedDate('');
        setSelectedSlots([]);
        setPurpose('');
        showToast('Resource booked successfully!', 'success');
        fetchData();
      } else {
        const errData = await res.json();
        if (errData.non_field_errors) setError(errData.non_field_errors[0]);
        else setError('Failed to book asset. Check dates and times.');
      }
    } catch (err) {
      setError('Error connecting to server.');
    }
  };

  const getAssetIcon = (category) => {
    if (category === 'Vehicles') return <Car size={16} />;
    if (category === 'Laptops' || category === 'Monitors') return <Monitor size={16} />;
    return <Briefcase size={16} />;
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-neutral-text-primary">Resource Booking</h2>
          <p className="text-neutral-text-secondary text-sm mt-1">Reserve shared company assets like vehicles and equipment.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg shadow-sm hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} /> New Booking
        </button>
      </div>

      <div className="flex-1 bg-white border border-neutral-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-border bg-neutral-surface">
          <h3 className="font-semibold text-neutral-text-primary">Upcoming Bookings</h3>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-neutral-text-secondary text-sm">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center text-neutral-text-secondary py-12">
              <CalendarIcon size={32} className="mx-auto mb-3 opacity-50" />
              <p>No upcoming bookings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map(booking => {
                const isMine = booking.employee === currentUser.id;
                return (
                  <div key={booking.id} className={`border rounded-xl p-4 transition-shadow hover:shadow-md ${isMine ? 'border-primary-300 bg-primary-50/30' : 'border-neutral-border'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 text-primary-700 font-semibold mb-1">
                        {getAssetIcon(booking.asset_details?.category_name)}
                        {booking.asset_details?.name}
                      </div>
                      {isMine && <span className="text-[10px] font-bold uppercase bg-primary-100 text-primary-700 px-2 py-0.5 rounded">My Booking</span>}
                    </div>
                    
                    <div className="text-sm text-neutral-text-primary mb-3">
                      Booked by: {booking.employee_name}
                    </div>

                    <div className="bg-white border border-neutral-border/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-neutral-text-secondary">
                        <CalendarIcon size={14} className="text-primary-500" />
                        <span className="font-medium text-neutral-text-primary">
                          {new Date(booking.start_time).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-text-secondary">
                        <Clock size={14} className="text-primary-500" />
                        <span>
                          {new Date(booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                          {new Date(booking.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                    
                    {booking.purpose && (
                      <div className="mt-3 text-xs text-neutral-text-secondary italic">
                        "{booking.purpose}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Booking Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-neutral-text-primary/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-border flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-bold text-lg text-neutral-text-primary">Book an Asset</h3>
              <button onClick={() => setShowForm(false)} className="text-neutral-text-muted hover:text-neutral-text-primary">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={submitBooking} className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-status-danger-bg text-status-danger-text text-sm rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">Asset</label>
                <select 
                  required
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-border rounded-lg outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                >
                  <option value="" disabled>Select a reservable asset</option>
                  {reservableAssets.map(a => (
                    <option key={a.id} value={a.id}>{a.tag} - {a.name}</option>
                  ))}
                </select>
                {reservableAssets.length === 0 && <p className="text-xs text-status-warning-text mt-1">No reservable assets available right now.</p>}
              </div>

              {selectedAsset && (
                <div>
                  <label className="block text-sm font-medium text-neutral-text-secondary mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]} // prevent past dates
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-border rounded-lg text-sm outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                  />
                </div>
              )}

              {selectedAsset && selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-neutral-text-secondary mb-2">Time Slots</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {SLOTS.map(hour => {
                      const status = getSlotStatus(hour);
                      let styleClass = '';
                      if (status === 'booked') {
                        styleClass = 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed';
                      } else if (status === 'selected') {
                        styleClass = 'bg-primary-600 text-white border-primary-600 shadow-sm';
                      } else {
                        styleClass = 'bg-white text-neutral-700 border-neutral-border hover:border-primary-500 hover:text-primary-600 cursor-pointer';
                      }

                      const timeStr = `${hour}:00 - ${hour+1}:00`;
                      
                      return (
                        <div 
                          key={hour}
                          onClick={() => handleSlotClick(hour)}
                          className={`text-xs text-center p-2 rounded-md border font-medium transition-colors select-none ${styleClass}`}
                        >
                          {timeStr}
                          {status === 'booked' && <div className="text-[9px] mt-0.5 uppercase tracking-wide">Booked</div>}
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-neutral-text-muted mt-2">
                    Click a slot to start, then click another slot to select a range.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">Purpose of Booking</label>
                <textarea 
                  required
                  rows={2}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-border rounded-lg outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 resize-none"
                  placeholder="e.g. Client meeting in downtown..."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 text-neutral-text-secondary font-medium hover:bg-neutral-surface rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={reservableAssets.length === 0 || selectedSlots.length === 0 || !selectedDate}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
