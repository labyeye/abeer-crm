import { forwardRef } from "react";
import logo from "../../images/logo.png";

interface BookingItem {
  description: string;
  rate: number;
  amount: number;
  dates?: string[];
  serviceType?: string;
}

interface BookingData {
  bookingNumber: string;
  date: string;
  status: string; // This determines if it's "Quotation" or "Invoice"
  client: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    contact?: string;
    gstin?: string;
  };
  branch?: { name?: string; code?: string };
  company?: { name?: string; address?: string };
  items: BookingItem[];
  total: number;
  advanceAmount?: number;
  balanceAmount?: number;
  termsAndConditions?: string[];
  validTill?: string;
  receivedAmount?: number;
  backDues?: number;
  currentDues?: number;
  totalDues?: number;
  event?: string;
  videoOutput?: string;
  photoOutput?: string;
  rawOutput?: string;
  audioOutput?: string;
  // flags to control whether the output lines should appear in the bill
  videoOutputEnabled?: boolean;
  photoOutputEnabled?: boolean;
  rawOutputEnabled?: boolean;
  audioOutputEnabled?: boolean;
  schedule?: {
    type?: string;
    serviceGiven?: string;
    serviceType?: string;
    quantity?: number;
    price?: number;
    amount?: number;
    date?: string;
    startTime?: string;
    endTime?: string;
    venue?: { name?: string; address?: string };
  }[];
}

interface BookingPDFTemplateProps {
  data: BookingData;
}

const BookingPDFTemplate = forwardRef<
  HTMLDivElement,
  BookingPDFTemplateProps
>(({ data }, ref) => {
  // Determine document type based on booking status
  const documentType = data.status === 'enquiry' ? 'Quotation' : 'Invoice';
  const documentLabel = data.status === 'enquiry' ? 'Quotation No.' : 'Invoice No.';

  return (
    <div
      ref={ref}
      className="bg-white p-8 font-sans relative text-black"
      style={{ width: "210mm", minHeight: "297mm", position: "relative" }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        {/* Company Logo and Info */}
        <div className="flex items-start w-full">
          <div className="flex items-center">
            <img src={logo} alt="Company Logo" className="w-32 h-32 mr-4" />
            <div>
              <h1 className="text-lg font-bold">
                {data.company?.name || "Abeer Motion Picture Pvt. Ltd."}
              </h1>
              {data.company?.address ? (
                <p className="text-sm">{data.company.address}</p>
              ) : (
                <p className="text-sm">Address: {data.client.address}</p>
              )}
            </div>
          </div>

          {/* Client / Bill To block */}
          <div className="ml-auto text-sm text-right">
            <div className="font-semibold">Bill To:</div>
            <div className="mt-1">
              <div>{data.client.name}</div>
              {data.client.phone && <div>Phone: {data.client.phone}</div>}
              {data.client.email && <div>Email: {data.client.email}</div>}
              {data.client.address && <div className="mt-1">{data.client.address}</div>}
              {data.client.gstin && (
                <div>GSTIN: {data.client.gstin}</div>
              )}
            </div>
          </div>
        </div>

        {/* Document Info */}
        <div className="text-right border border-gray-300 p-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold">{documentLabel}</div>
              <div className="font-semibold">Date:</div>
            </div>
            <div>
              <div>{data.bookingNumber}</div>
              <div>{data.date}</div>
            </div>
          </div>
          {data.branch?.name && (
            <div className="mt-2 text-sm">
              <strong>Branch:</strong> {data.branch.name}
            </div>
          )}
        </div>
      </div>

      {/* Document Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold border-b-2 border-gray-300 pb-2">
          {documentType}
        </h2>
      </div>

      {/* Event Information */}
      {data.event && (
        <div className="mb-6 text-center">
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
            <h3 className="text-lg font-semibold text-gray-900">Event: {data.event}</h3>
          </div>
        </div>
      )}

      {/* Schedule Details */}
      {data.schedule && data.schedule.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 border-b border-gray-300 pb-1">
            Service Schedule
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Service Given</th>
                  <th className="border border-gray-300 p-2 text-left">Type</th>
                  <th className="border border-gray-300 p-2 text-left">Event</th>
                  <th className="border border-gray-300 p-2 text-left">Start Date</th>
                  <th className="border border-gray-300 p-2 text-left">Start Time</th>
                  <th className="border border-gray-300 p-2 text-left">End Time</th>
                  <th className="border border-gray-300 p-2 text-right">Rate</th>
                  <th className="border border-gray-300 p-2 text-right">Amount</th>
                  <th className="border border-gray-300 p-2 text-right">Qty</th>
                  <th className="border border-gray-300 p-2 text-left">Venue</th>
                </tr>
              </thead>
              <tbody>
                {data.schedule.map((scheduleItem, index) => {
                  // Prefer explicit numeric price/rate when provided; do not default to 0
                  const rawRate = (scheduleItem as any).price ?? (scheduleItem as any).rate;
                  const rate = typeof rawRate === "number" ? rawRate : undefined;
                  const qty = (scheduleItem as any).quantity ?? 1;

                  // If an explicit amount property exists and is a positive number, use it.
                  // Otherwise, compute amount from rate * qty only when rate is a positive number.
                  const hasExplicitAmount = Object.prototype.hasOwnProperty.call(
                    scheduleItem as any,
                    "amount"
                  );
                  const rawAmount = hasExplicitAmount ? (scheduleItem as any).amount : undefined;
                  let amountToShow: number | undefined = undefined;
                  if (typeof rawAmount === "number" && rawAmount > 0) {
                    amountToShow = rawAmount;
                  } else if (typeof rate === "number" && rate > 0) {
                    const calc = rate * (Number(qty) || 1);
                    if (calc > 0) amountToShow = calc;
                  }

                  return (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">{scheduleItem.serviceGiven || scheduleItem.serviceType || '-'}</td>
                      <td className="border border-gray-300 p-2">{scheduleItem.serviceType || '-'}</td>
                      <td className="border border-gray-300 p-2">{(scheduleItem as any).event || '-'}</td>
                      <td className="border border-gray-300 p-2">{scheduleItem.date || '-'}</td>
                      <td className="border border-gray-300 p-2">{scheduleItem.startTime || '-'}</td>
                      <td className="border border-gray-300 p-2">{scheduleItem.endTime || '-'}</td>
                      <td className="border border-gray-300 p-2 text-right">{typeof rate === 'number' && rate > 0 ? `₹${rate}` : '-'}</td>
                      <td className="border border-gray-300 p-2 text-right">{typeof amountToShow === 'number' && amountToShow > 0 ? `₹${amountToShow}` : '-'}</td>
                      <td className="border border-gray-300 p-2 text-right">{scheduleItem.quantity ?? '-'}</td>
                      <td className="border border-gray-300 p-2">{scheduleItem.venue?.name ?? scheduleItem.venue?.address ?? '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Items Table */}
      

      {/* Output Specifications (only show if enabled or present) */}
      {(
        ((data.videoOutputEnabled ?? !!data.videoOutput) && !!data.videoOutput) ||
        ((data.photoOutputEnabled ?? !!data.photoOutput) && !!data.photoOutput) ||
        ((data.rawOutputEnabled ?? !!data.rawOutput) && !!data.rawOutput) ||
        ((data.audioOutputEnabled ?? !!data.audioOutput) && !!data.audioOutput)
      ) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 border-b border-gray-300 pb-1">
            Output Specifications
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {((data.videoOutputEnabled ?? !!data.videoOutput) && data.videoOutput) && (
              <p><strong>Video Output:</strong> {data.videoOutput}</p>
            )}
            {((data.photoOutputEnabled ?? !!data.photoOutput) && data.photoOutput) && (
              <p><strong>Photo Output:</strong> {data.photoOutput}</p>
            )}
            {((data.rawOutputEnabled ?? !!data.rawOutput) && data.rawOutput) && (
              <p><strong>Raw Output:</strong> {data.rawOutput}</p>
            )}
            {((data.audioOutputEnabled ?? !!data.audioOutput) && data.audioOutput) && (
              <p><strong>Audio Output:</strong> {data.audioOutput}</p>
            )}
          </div>
        </div>
      )}

      {/* Payment Details */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-3 border-b border-gray-300 pb-1">
            Payment Details
          </h3>
          <div className="text-sm space-y-1">
            <p><strong>Total Amount:</strong> ₹{data.total}</p>
            {data.advanceAmount && (
              <p><strong>Advance Amount:</strong> ₹{data.advanceAmount}</p>
            )}
            {data.balanceAmount && (
              <p><strong>Balance Amount:</strong> ₹{data.balanceAmount}</p>
            )}
            {data.receivedAmount && (
              <p><strong>Received Amount:</strong> ₹{data.receivedAmount}</p>
            )}
          </div>
        </div>

        <div>
          {data.validTill && (
            <>
              <h3 className="text-lg font-semibold mb-3 border-b border-gray-300 pb-1">
                Validity
              </h3>
              <p className="text-sm"><strong>Valid Till:</strong> {data.validTill}</p>
            </>
          )}
        </div>
      </div>

      {/* Terms and Conditions */}
      {data.termsAndConditions && data.termsAndConditions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 border-b border-gray-300 pb-1">
            Terms & Conditions
          </h3>
          <ul className="text-sm space-y-1 list-disc pl-5">
            {data.termsAndConditions.map((term, index) => (
              <li key={index}>{term}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-8 left-8 right-8">
        <div className="border-t border-gray-300 pt-4 text-center text-sm text-gray-600">
          <p>Thank you for choosing our services!</p>
          <p>For any queries, please contact us at the above mentioned details.</p>
        </div>
      </div>
    </div>
  );
});

BookingPDFTemplate.displayName = "BookingPDFTemplate";

export default BookingPDFTemplate;