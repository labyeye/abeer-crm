import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { bookingAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const statusLabel = (s: string) => {
  switch (s) {
    case 'enquiry': return 'Enquiry';
    case 'pending': return 'Pending';
    case 'confirmed': return 'Confirmed';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return s;
  }
};

const AssignedBookings: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssigned();
  }, []);

  const fetchAssigned = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res: any = await bookingAPI.getBookingsForStaff(user.id);
      const data = res.data || res;
      setBookings(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Error', message: (err && err.message) || 'Failed to fetch bookings' });
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, action: 'reached' | 'ongoing' | 'work_done') => {
    // Map UI actions to backend statuses
    let status = 'in_progress';
    if (action === 'work_done') status = 'completed';
    // reached and ongoing both map to in_progress (we'll optionally add a small note for 'reached')

    setUpdatingId(bookingId);
    try {
      await bookingAPI.updateBookingStatus(bookingId, status);
      if (action === 'reached') {
        // Attempt to send a short note via outputs endpoint (staff allowed)
        try {
          await bookingAPI.updateBookingOutputs(bookingId, { notes: 'Staff: Reached venue' });
        } catch (e) {
          // ignore non-critical failure
        }
      }
      addNotification({ type: 'success', title: 'Updated', message: 'Booking status updated.' });
      // refresh single item locally
      await fetchAssigned();
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Error', message: (err && err.message) || 'Failed to update status' });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold">Assigned Bookings</h1>
        <p className="text-sm text-gray-600">Bookings assigned to you. Update status when you reach / start / finish work.</p>
      </div>

      <div>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8">No bookings assigned to you.</div>
        ) : (
          <div className="grid gap-4">
            {bookings.map(b => (
              <div key={b._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{b.bookingNumber} — {b.client?.name || 'Client'}</p>
                  <p className="text-sm text-gray-600">{b.functionDetails?.venue?.name || b.functionDetailsList?.[0]?.venue?.name || ''} • {new Date(b.functionDetails?.date || b.functionDetailsList?.[0]?.date || b.createdAt).toLocaleString()}</p>
                  <p className="text-sm mt-2">Status: <span className="font-medium">{statusLabel(b.status)}</span></p>
                </div>

                <div className="mt-4 md:mt-0 flex gap-2">
                  <button disabled={updatingId === b._id} onClick={() => handleStatusUpdate(b._id, 'reached')} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded">Reached</button>
                  <button disabled={updatingId === b._id} onClick={() => handleStatusUpdate(b._id, 'ongoing')} className="px-3 py-2 bg-amber-50 text-amber-700 rounded">Ongoing</button>
                  <button disabled={updatingId === b._id} onClick={() => handleStatusUpdate(b._id, 'work_done')} className="px-3 py-2 bg-green-50 text-green-700 rounded">Work done</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedBookings;
