import React, { useEffect, useState } from 'react';
import { clientAPI, paymentAPI } from '../../services/api';
import DateInputDDMMYYYY from '../common/DateInputDDMMYYYY';
import logo from '../../images/logo.png';

const ReceivePayment: React.FC<{ onDone?: () => void }> = ({ onDone }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState<boolean>(false);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [bookingPayments, setBookingPayments] = useState<any[]>([]);
  const [bookingPaymentsLoading, setBookingPaymentsLoading] = useState<boolean>(false);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [allPaymentsLoading, setAllPaymentsLoading] = useState<boolean>(false);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<string>('cash');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setClientsLoading(true);
      try {
        const res = await clientAPI.getClients();
        // API may return { success, count, data } or direct array
        const list = Array.isArray(res) ? res : (res && res.data) ? res.data : [];
        setClients(list);
      } catch (err) {
        console.error('Failed to load clients', err);
      } finally {
        setClientsLoading(false);
      }
    })();
  }, []);

  // Load all payments on component mount
  useEffect(() => {
    (async () => {
      setAllPaymentsLoading(true);
      try {
        const res = await paymentAPI.getPayments({ limit: 1000 }); // Get all payments
        const list = Array.isArray(res) ? res : (res && res.data) ? res.data : res || [];
        setAllPayments(list);
      } catch (err) {
        console.error('Failed to load all payments', err);
      } finally {
        setAllPaymentsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedClient) {
      setBookings([]);
      setSelectedBooking(null);
      return;
    }
    (async () => {
      setBookingsLoading(true);
      try {
        const res = await paymentAPI.getClientBookings(selectedClient);
        const list = Array.isArray(res) ? res : (res && res.data) ? res.data : [];
        setBookings(list);
      } catch (err) {
        console.error('Failed to load bookings for client', err);
      } finally {
        setBookingsLoading(false);
      }
    })();
  }, [selectedClient]);

  useEffect(() => {
    // If in single-select mode and a booking is selected, prefill amount from booking.pricing
    if (multiSelectMode) return;
    if (!selectedBooking) return;
    const b = bookings.find(x => x._id === selectedBooking);
    if (b) {
      setAmount(b.amount || b.pricing?.finalAmount || b.pricing?.totalAmount || b.pricing?.remainingAmount || '');
    }
  }, [selectedBooking, bookings, multiSelectMode]);

  // fetch payments for the selected booking
  useEffect(() => {
    if (!selectedBooking) {
      setBookingPayments([]);
      return;
    }
    (async () => {
      setBookingPaymentsLoading(true);
      try {
        const res = await paymentAPI.getPayments({ booking: selectedBooking, limit: 100 });
        const list = Array.isArray(res) ? res : (res && res.data) ? res.data : res || [];
        setBookingPayments(list);
      } catch (err) {
        console.error('Failed to load booking payments', err);
      } finally {
        setBookingPaymentsLoading(false);
      }
    })();
  }, [selectedBooking]);

  const submit = async () => {
    setError(null);
    if (!selectedClient) return setError('Please select a client');
    if (!date) return setError('Please select a date');
    if (!amount || Number(amount) <= 0) return setError('Please enter a valid amount');
    
    // Validate booking selection
    if (multiSelectMode && selectedBookings.length === 0) {
      return setError('Please select at least one booking for multi-select mode');
    }
    if (!multiSelectMode && !selectedBooking) {
      return setError('Please select a booking or enable multi-select mode');
    }
    
    setSaving(true);
    try {
      const payload: any = {
        client: selectedClient,
        amount: Number(amount),
        date,
        method,
        notes
      };
      
      // Add booking info based on mode
      if (multiSelectMode && selectedBookings.length > 0) {
        payload.bookings = selectedBookings;
      } else if (selectedBooking) {
        payload.booking = selectedBooking;
      }
      let res;
      if (editingPaymentId) {
        res = await paymentAPI.updatePayment(editingPaymentId, payload);
      } else {
        res = await paymentAPI.createPayment(payload);
      }
      // normalize created payment from different API shapes
      const createdPayment = Array.isArray(res)
        ? res[0]
        : res && res.data
        ? res.data
        : res;
      // refresh bookings and payments for the selected client/booking
      if (selectedClient) {
        try {
          const res = await paymentAPI.getClientBookings(selectedClient);
          const list = Array.isArray(res) ? res : (res && res.data) ? res.data : [];
          setBookings(list);
        } catch (e) {
          console.error('Failed to refresh bookings after payment', e);
        }
      }

      if (selectedBooking && !multiSelectMode) {
        try {
          const res2 = await paymentAPI.getPayments({ booking: selectedBooking, limit: 100 });
          const list2 = Array.isArray(res2) ? res2 : (res2 && res2.data) ? res2.data : res2 || [];
          // update amount field to remaining if available
          const b = bookings.find(x => x._id === selectedBooking);
          const remaining = b?.pricing?.remainingAmount ?? b?.pricing?.totalAmount ?? null;
          if (remaining != null) setAmount(remaining);
          // ensure created payment appears at the top of the list if backend didn't include it
          let finalList = list2 || [];
          if (createdPayment && createdPayment._id) {
            const exists = finalList.some((p: any) => p._id === createdPayment._id);
            if (!exists) finalList = [createdPayment, ...finalList];
          }
          setBookingPayments(finalList);
        } catch (e) {
          console.error('Failed to refresh booking payments after payment', e);
        }
      } else if (multiSelectMode) {
        // For multi-booking payments, clear selections and reset amount
        setSelectedBookings([]);
        setAmount('');
      }

      // Refresh all payments list
      await refreshAllPayments();

      setSaving(false);
      if (onDone) onDone();
      alert(editingPaymentId ? 'Payment updated' : 'Payment saved');
      setEditingPaymentId(null);
    } catch (err) {
      console.error(err);
      setSaving(false);
      setError('Failed to save payment');
    }
  };

  const handleEdit = (p: any) => {
    // populate form with payment for editing
    setEditingPaymentId(p._id);
    setSelectedClient(p.client?._id || p.client || selectedClient);
    
    // Handle multi-booking vs single booking
    if (p.bookings && Array.isArray(p.bookings) && p.bookings.length > 0) {
      setMultiSelectMode(true);
      setSelectedBookings(p.bookings.map((b: any) => b._id || b));
      setSelectedBooking(null);
    } else {
      setMultiSelectMode(false);
      setSelectedBooking(p.booking?._id || p.booking || null);
      setSelectedBookings([]);
    }
    
    setDate(p.date ? new Date(p.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10));
    setAmount(p.amount || '');
    setMethod(p.method || 'cash');
    setNotes(p.notes || '');
    // scroll to top where the form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshAllPayments = async () => {
    try {
      const res = await paymentAPI.getPayments({ limit: 1000 });
      const list = Array.isArray(res) ? res : (res && res.data) ? res.data : res || [];
      setAllPayments(list);
    } catch (err) {
      console.error('Failed to refresh all payments', err);
    }
  };

  const handleDelete = async (p: any) => {
    if (!p || !p._id) return;
    if (!confirm('Delete this payment? This will revert booking/invoice balances.')) return;
    try {
      await paymentAPI.deletePayment(p._id);
      // refresh payments list
      if (selectedBooking) {
        const res2 = await paymentAPI.getPayments({ booking: selectedBooking, limit: 100 });
        const list2 = Array.isArray(res2) ? res2 : (res2 && res2.data) ? res2.data : res2 || [];
        setBookingPayments(list2);
      }
      // refresh bookings
      if (selectedClient) {
        const resb = await paymentAPI.getClientBookings(selectedClient);
        const listb = Array.isArray(resb) ? resb : (resb && resb.data) ? resb.data : [];
        setBookings(listb);
      }
      // refresh all payments
      await refreshAllPayments();
      alert('Payment deleted');
    } catch (e) {
      console.error('Failed to delete payment', e);
      alert('Failed to delete payment');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 rounded-t-xl">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V4m0 16v-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Receive Payment</h1>
                <p className="text-emerald-100 mt-1">Record a payment received from your client</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-8">
            <form className="space-y-8">
              {/* Basic Info Section */}
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                  </svg>
                  Payment Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                      </svg>
                      Date
                    </label>
                    <DateInputDDMMYYYY
                      value={date}
                      onChange={(v) => setDate(v)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Payment Method
                    </label>
                    <select 
                      value={method} 
                      onChange={e => setMethod(e.target.value)} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 bg-white"
                    >
                      <option value="cash">💵 Cash</option>
                      <option value="card">💳 Card</option>
                      <option value="upi">📱 UPI</option>
                      <option value="bank_transfer">🏦 Bank Transfer</option>
                      <option value="cheque">📝 Cheque</option>
                      <option value="other">🔄 Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Client & Booking Section */}
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Client Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Client
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedClient || ''} 
                        onChange={e => setSelectedClient(e.target.value || null)} 
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 bg-white"
                      >
                        <option value="">Select a client...</option>
                        {clients.map(c => (
                          <option key={c._id} value={c._id}>
                            {c.name || c.displayName || c.email || c._id}
                          </option>
                        ))}
                      </select>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {clientsLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Choose the client who made the payment
                    </p>
                  </div>

                  <div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-700">Select Booking</div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500">Multi-select</label>
                          <input type="checkbox" checked={multiSelectMode} onChange={e => {
                            const on = e.target.checked;
                            // clear single selection when enabling multi
                            if (on) setSelectedBooking(null);
                            setMultiSelectMode(on);
                            if (!on) setSelectedBookings([]);
                          }} />
                        </div>
                      </div>

                      {!multiSelectMode ? (
                        <>
                          <select 
                            value={selectedBooking || ''} 
                            onChange={e => setSelectedBooking(e.target.value || null)} 
                            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 bg-white"
                            disabled={!selectedClient}
                          >
                            <option value="">-- No specific booking --</option>
                            {bookings.map(b => {
                              const title = b.serviceName || b.title || b.bookingNumber || b._id;
                              const amt = b.amount || b.pricing?.finalAmount || b.pricing?.totalAmount;
                              const dateLabel = b.functionDetails?.date ? new Date(b.functionDetails.date).toLocaleDateString() : '';
                              return (
                                <option key={b._id} value={b._id}>
                                  {title}{dateLabel ? ` • ${dateLabel}` : ''}{amt ? ` • ₹${Number(amt).toLocaleString()}` : ''}
                                </option>
                              );
                            })}
                          </select>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </>
                      ) : (
                        <div className="bg-white border border-gray-200 rounded p-3 max-h-56 overflow-y-auto">
                          {bookings.map(b => {
                            const title = b.serviceName || b.title || b.bookingNumber || b._id;
                            const amt = b.amount || b.pricing?.finalAmount || b.pricing?.totalAmount;
                            const dateLabel = b.functionDetails?.date ? new Date(b.functionDetails.date).toLocaleDateString() : '';
                            const checked = selectedBookings.includes(b._id);
                            return (
                              <label key={b._id} className="flex items-center justify-between py-2 border-b border-gray-100">
                                <div>
                                  <div className="text-sm font-medium">{title} {dateLabel ? <span className="text-xs text-gray-500">• {dateLabel}</span> : null}</div>
                                  <div className="text-xs text-gray-500">{amt ? `₹${Number(amt).toLocaleString()}` : '—'}</div>
                                </div>
                                <input type="checkbox" checked={checked} onChange={e => {
                                  if (e.target.checked) setSelectedBookings(s => [...s, b._id]);
                                  else setSelectedBookings(s => s.filter(id => id !== b._id));
                                }} />
                              </label>
                            );
                          })}
                        </div>
                      )}
                      {bookingsLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {multiSelectMode ? 'Select multiple bookings for this payment' : 'Link payment to a specific booking for better tracking'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Amount Section */}
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V4m0 16v-4" />
                  </svg>
                  Amount
                </h3>

                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-lg">₹</span>
                      <input 
                        type="number" 
                        value={amount as any} 
                        onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))} 
                        className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 text-lg font-semibold"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Enter the amount received in Indian Rupees</p>
                  </div>

                  <div>
                    <button 
                      type="button"
                      onClick={() => {
                        if (multiSelectMode && selectedBookings.length > 0) {
                          // Calculate total remaining amount for selected bookings
                          const total = selectedBookings.reduce((sum, id) => {
                            const b = bookings.find(x => x._id === id);
                            const amt = b?.pricing?.remainingAmount ?? b?.amount ?? b?.pricing?.finalAmount ?? b?.pricing?.totalAmount ?? 0;
                            return sum + Number(amt || 0);
                          }, 0);
                          if (total > 0) setAmount(total);
                        } else if (selectedBooking) {
                          const b = bookings.find(x => x._id === selectedBooking);
                          const amt = b?.pricing?.remainingAmount ?? b?.amount ?? b?.pricing?.finalAmount ?? b?.pricing?.totalAmount;
                          if (amt) setAmount(Number(amt));
                        }
                      }} 
                      disabled={!(selectedBooking || (multiSelectMode && selectedBookings.length > 0))}
                      className="px-6 py-4 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Auto-fill
                    </button>
                  </div>
                </div>
                {/* Remaining and History */}
                <div className="mt-4">
                  {selectedBooking && (() => {
                    const b = bookings.find(x => x._id === selectedBooking);
                    const remaining = b?.pricing?.remainingAmount ?? b?.pricing?.totalAmount ?? null;
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-600">Remaining Amount:</div>
                          <div className="px-3 py-1 bg-yellow-50 text-yellow-800 rounded font-semibold">{remaining != null ? `₹${Number(remaining).toLocaleString()}` : '—'}</div>
                          <div className="text-xs text-gray-500">(updates when payments are recorded)</div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-600 mb-2">Payment History</div>
                          <div className="bg-gray-50 border border-gray-100 rounded">
                            {bookingPaymentsLoading ? (
                              <div className="p-4 text-sm text-gray-500">Loading payments...</div>
                            ) : bookingPayments && bookingPayments.length ? (
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-gray-600">
                                    <th className="px-3 py-2">Date</th>
                                    <th className="px-3 py-2">Amount</th>
                                    <th className="px-3 py-2">Method</th>
                                    <th className="px-3 py-2">Notes</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bookingPayments.map(p => (
                                    <tr key={p._id} className="border-t border-gray-100">
                                      <td className="px-3 py-2">{new Date(p.date).toLocaleDateString()}</td>
                                      <td className="px-3 py-2">₹{Number(p.amount).toLocaleString()}</td>
                                      <td className="px-3 py-2">{p.method}</td>
                                      <td className="px-3 py-2">{p.notes || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="p-4 text-sm text-gray-500">No payments recorded for this booking</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Additional Notes
                  <span className="text-xs text-gray-500 font-normal">(optional)</span>
                </label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200" 
                  rows={4}
                  placeholder="Add any additional information about this payment..."
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700 font-medium">{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button 
                  type="button"
                  onClick={() => { if (onDone) onDone(); }} 
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>

                <button 
                  type="button"
                  onClick={submit} 
                  disabled={saving} 
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-3 shadow-lg"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className="font-semibold">
                    {saving ? 'Processing Payment...' : 'Save Payment'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Payment History & Invoice Actions */}
      <div className="max-w-4xl mx-auto mt-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">All Payment History & Bills</h3>
            <div className="text-sm text-gray-500">
              Total Payments: {allPayments.length} | 
              Total Amount: ₹{allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0).toLocaleString()}
            </div>
          </div>
          {allPaymentsLoading ? (
            <div className="text-sm text-gray-500 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto mb-2" />
              Loading all payments...
            </div>
          ) : allPayments && allPayments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="text-left text-gray-600 bg-gray-50">
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold">Amount (₹)</th>
                    <th className="px-3 py-3 font-semibold">Method</th>
                    <th className="px-3 py-3 font-semibold">Client</th>
                    <th className="px-3 py-3 font-semibold">Booking</th>
                    <th className="px-3 py-3 font-semibold">Notes</th>
                    <th className="px-3 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allPayments.map((p: any) => (
                    <tr key={p._id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-3">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                      <td className="px-3 py-3 font-medium">₹{Number(p.amount).toLocaleString()}</td>
                      <td className="px-3 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {p.method}
                        </span>
                      </td>
                      <td className="px-3 py-3">{(p.client && (p.client.name || p.client.displayName)) || (clients.find(c => c._id === p.client)?.name) || '—'}</td>
                      <td className="px-3 py-3">
                        {p.bookings && Array.isArray(p.bookings) && p.bookings.length > 1 ? (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            Multi ({p.bookings.length} bookings)
                          </span>
                        ) : (
                          (p.booking && (p.booking.bookingNumber || p.booking.title)) || 
                          (bookings.find(b => b._id === p.booking)?.bookingNumber) || 
                          (p.bookings && p.bookings[0] && (p.bookings[0].bookingNumber || p.bookings[0].title)) ||
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-600">{p.notes || '—'}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openInvoiceWindow(p)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700"
                            title="Download Receipt"
                          >
                            📄
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(p)}
                            className="px-2 py-1 bg-yellow-400 text-black rounded text-xs hover:bg-yellow-500"
                            title="Edit Payment"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            title="Delete Payment"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-sm text-gray-500">No payments recorded yet</div>
              <div className="text-xs text-gray-400">Start by creating your first payment above</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// helper to open a printable invoice in a new window
function openInvoiceWindow(payment: any) {
  const client = payment.client && (payment.client.name || payment.client.displayName) ? payment.client : null;
  const booking = payment.booking || null;
  const createdAt = payment.date || payment.createdAt || new Date().toISOString();
  const amountRaw = Number(payment.amount || 0);
  const amount = new Intl.NumberFormat('en-IN').format(amountRaw);
  const notes = payment.notes || '';

  // Build itemized rows if booking contains a servicesSchedule or items
  let itemsHtml = '';
  let subtotal = 0;
  const schedule = (booking && (booking.servicesSchedule || booking.items || booking.services)) || [];
  if (Array.isArray(schedule) && schedule.length > 0) {
    const rows = schedule.map((it: any, idx: number) => {
      const desc = it.serviceName || it.name || it.description || (typeof it === 'string' ? it : `Item ${idx + 1}`);
      const qty = Number(it.quantity || 1);
      const price = Number(it.amount || it.price || 0);
      const rowAmount = qty * price;
      subtotal += rowAmount;
      return `<tr><td style="padding:10px;border-bottom:1px solid #e5e7eb">${desc}${qty !== 1 ? ` x${qty}` : ''}</td><td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right">₹ ${new Intl.NumberFormat('en-IN').format(rowAmount)}</td></tr>`;
    });
    itemsHtml = rows.join('');
  } else {
    // Fallback single line item
    subtotal = amountRaw;
    itemsHtml = `<tr><td style="padding:10px;border-bottom:1px solid #e5e7eb">Payment received <div style="font-size:12px;color:#6b7280">Method: ${payment.method || '—'}${notes ? ' • ' + notes : ''}</div></td><td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right">₹ ${amount}</td></tr>`;
  }

  const total = booking?.pricing?.totalAmount ?? subtotal;
  const remaining = booking?.pricing?.remainingAmount ?? (total - (booking?.pricing?.advanceAmount || 0));

  const html = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Receipt - ${payment._id}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: Arial, Helvetica, sans-serif; color:#111827; padding:20px }
      .paper { width:210mm; min-height:297mm; margin:auto; background:white; padding:24px; box-sizing:border-box }
      .header { display:flex; justify-content:space-between; align-items:flex-start }
      .company { display:flex; gap:16px; align-items:center }
      .logo { width:110px; height:110px; object-fit:contain }
      .muted { color:#6b7280 }
      .info-box { border:1px solid #e5e7eb; padding:12px }
      table { width:100%; border-collapse:collapse; margin-top:12px }
      th, td { padding:10px; border-bottom:1px solid #e5e7eb; text-align:left }
      .right { text-align:right }
      .total-row { font-weight:700 }
      .terms { font-size:12px; color:#6b7280 }
      .btn { display:inline-block; padding:8px 12px; background:#10b981; color:white; text-decoration:none; border-radius:6px }
    </style>
  </head>
  <body>
    <div class="paper">
      <div class="header">
        <div class="company">
          <img src="${logo}" class="logo" alt="Logo" />
          <div>
            <div style="font-weight:700; font-size:18px">Abeer Motion Picture Pvt. Ltd.</div>
            <div class="muted">Event Photography & Videography</div>
            <div style="font-size:13px; margin-top:6px">Email: info@example.com | Phone: +91-XXXXXXXXXX</div>
          </div>
        </div>

        <div class="info-box">
          <div style="font-weight:600">Receipt</div>
          <div style="margin-top:6px">Receipt #: <strong>${payment._id}</strong></div>
          <div class="muted">Date: ${new Date(createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; margin-top:18px">
        <div>
          <div style="font-weight:600">Billed To</div>
          <div>${client ? (client.name || client.displayName || client.email) : (payment.client || '')}</div>
          <div class="muted">${client && client.address ? client.address : ''}</div>
        </div>

        <div>
          <div style="font-weight:600">Booking</div>
          <div>${booking ? (booking.bookingNumber || booking.title || booking._id) : ''}</div>
          <div class="muted">${booking && booking.functionDetails?.date ? new Date(booking.functionDetails.date).toLocaleDateString() : ''}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="display:flex; justify-content:flex-end; margin-top:12px">
        <div style="width:320px">
          <div style="display:flex; justify-content:space-between; padding:8px 0"><div>Subtotal</div><div>₹ ${new Intl.NumberFormat('en-IN').format(subtotal)}</div></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0" class="muted"><div>Amount Received</div><div>₹ ${amount}</div></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0; font-weight:700; border-top:1px solid #e5e7eb"><div>Total</div><div>₹ ${new Intl.NumberFormat('en-IN').format(total)}</div></div>
          <div style="display:flex; justify-content:space-between; padding:8px 0;" class="muted"><div>Remaining</div><div>₹ ${new Intl.NumberFormat('en-IN').format(remaining ?? 0)}</div></div>
        </div>
      </div>

      <div style="margin-top:28px; display:flex; justify-content:space-between; align-items:center">
        <div class="terms">This is a computer generated receipt. Bank details: A/C No. 50100158433 IFSC: HDFC0003716</div>
        <div>
          <a href="#" onclick="window.print(); return false;" class="btn">Print / Save</a>
        </div>
      </div>

    </div>
  </body>
  </html>
  `;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
  } else {
    alert('Popup blocked - please allow popups for this site to download the bill.');
  }
}

export default ReceivePayment;
