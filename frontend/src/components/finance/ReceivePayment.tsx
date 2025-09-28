import React, { useEffect, useState } from 'react';
import { clientAPI, paymentAPI } from '../../services/api';
import DateInputDDMMYYYY from '../common/DateInputDDMMYYYY';

const ReceivePayment: React.FC<{ onDone?: () => void }> = ({ onDone }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [bookingPayments, setBookingPayments] = useState<any[]>([]);
  const [bookingPaymentsLoading, setBookingPaymentsLoading] = useState<boolean>(false);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<string>('cash');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    // If a booking is selected, prefill amount from booking.amount or booking.pricing
    if (!selectedBooking) return;
    const b = bookings.find(x => x._id === selectedBooking);
    if (b) {
      setAmount(b.amount || b.pricing?.finalAmount || b.pricing?.totalAmount || b.pricing?.remainingAmount || '');
    }
  }, [selectedBooking, bookings]);

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
    setSaving(true);
    try {
      const payload = {
        client: selectedClient,
        booking: selectedBooking,
        amount: Number(amount),
        date,
        method,
        notes
      };
      await paymentAPI.createPayment(payload);
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

      if (selectedBooking) {
        try {
          const res2 = await paymentAPI.getPayments({ booking: selectedBooking, limit: 100 });
          const list2 = Array.isArray(res2) ? res2 : (res2 && res2.data) ? res2.data : res2 || [];
          setBookingPayments(list2);
          // update amount field to remaining if available
          const b = bookings.find(x => x._id === selectedBooking);
          const remaining = b?.pricing?.remainingAmount ?? b?.pricing?.totalAmount ?? null;
          if (remaining != null) setAmount(remaining);
        } catch (e) {
          console.error('Failed to refresh booking payments after payment', e);
        }
      }

      setSaving(false);
      if (onDone) onDone();
      alert('Payment saved');
    } catch (err) {
      console.error(err);
      setSaving(false);
      setError('Failed to save payment');
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

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Client
                      <span className="ml-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        {clients.length} loaded
                      </span>
                    </label>
                    <div className="relative">
                      <select 
                        aria-label="Select client" 
                        value={selectedClient || ''} 
                        onChange={e => setSelectedClient(e.target.value || null)} 
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 bg-white"
                      >
                        <option value="">-- Select a client --</option>
                        {clients.map(c => (
                          <option key={c._id} value={c._id}>
                            {c.name || c.displayName || c.email}
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Related Booking 
                      <span className="text-xs text-gray-500 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
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
                      Link payment to a specific booking for better tracking
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
                        if (selectedBooking) {
                          const b = bookings.find(x => x._id === selectedBooking);
                          const amt = b?.amount || b?.pricing?.finalAmount || b?.pricing?.totalAmount;
                          if (amt) setAmount(Number(amt));
                        }
                      }} 
                      disabled={!selectedBooking}
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
    </div>
  );
};

export default ReceivePayment;
