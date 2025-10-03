import { forwardRef } from "react";
import logo from "../../images/logo.png";
interface QuotationItem {
  description: string;
  rate: number;
  amount: number;
  dates?: string[];
  serviceType?: string;
}

interface QuotationData {
  quotationNumber: string;
  date: string;
  client: {
    name: string;
    address: string;
    contact: string;
    gstin?: string;
  };

  branch?: { name?: string; code?: string };
  company?: { name?: string; address?: string };
  items: QuotationItem[];
  total: number;
  advanceAmount?: number;
  balanceAmount?: number;
  termsAndConditions?: string[];
  validTill?: string;
  receivedAmount?: number;
  backDues?: number;
  currentDues?: number;
  totalDues?: number;
  videoOutput?: string;
  photoOutput?: string;
  rawOutput?: string;

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

interface QuotationPDFTemplateProps {
  data: QuotationData;
}

const QuotationPDFTemplate = forwardRef<
  HTMLDivElement,
  QuotationPDFTemplateProps
>(({ data }, ref) => {
  return (
    <div
      ref={ref}
      className="bg-white p-8 font-sans relative text-black"
      style={{ width: "210mm", minHeight: "297mm", position: "relative" }}
    >
      {}
      <div className="flex justify-between items-start mb-6">
        {}
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
            <p className="text-sm">Client: {data.client.name}</p>
            <p className="text-sm">Contact: {data.client.contact}</p>
            {data.client.gstin && (
              <p className="text-sm">GSTIN: {data.client.gstin}</p>
            )}
          </div>
        </div>

        {}
        <div className="text-right border border-gray-300 p-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold">Invoice No.:</div>
              <div className="font-semibold">Date:</div>
            </div>
            <div>
              <div>{data.quotationNumber}</div>
              <div>{data.date}</div>
            </div>
          </div>
          {data.branch?.name && (
            <div className="mt-2 text-sm">
              Branch: {data.branch.name}{" "}
              {data.branch.code ? `(${data.branch.code})` : ""}
            </div>
          )}
          <div className="mt-2 border-t pt-2">
            <div className="font-bold">
              Received: ₹ {data.receivedAmount?.toLocaleString() || "0"}/-
            </div>
            <div className="text-xs text-gray-600">
              (Advance/received amounts shown)
            </div>
          </div>
        </div>
      </div>

      {}
      {data.schedule && data.schedule.length > 0 && (
        <div className="mb-6 p-3 border rounded bg-gray-50">
          <div className="font-bold mb-2">Service Schedule</div>
          <div className="grid grid-cols-1 gap-2 text-sm text-gray-800">
            {data.schedule.map((s, i) => (
              <div key={i} className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{s.type || `Service ${i + 1}`}</div>
                  {s.serviceGiven && (
                    <div className="text-xs text-gray-700">Service: {s.serviceGiven}</div>
                  )}
                  {s.serviceType && (
                    <div className="text-xs text-gray-600">Type: {s.serviceType}</div>
                  )}
                  <div className="text-xs text-gray-600">
                    Qty: {s.quantity ?? 0} × Price: {s.price ? `₹ ${s.price.toLocaleString()}` : "-"} = {" "}
                    <strong>{typeof s.amount === 'number' ? `₹ ${Number(s.amount).toLocaleString()}` : '-'}</strong>
                  </div>
                  <div className="text-xs">
                    {s.venue?.name || ""} {s.venue?.address ? `- ${s.venue.address}` : ""}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div>Date: {s.date || "N/A"}</div>
                  <div>Time: {s.startTime || "-"} - {s.endTime || "-"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      <div className=" mb-6">
        <div className="bg-gray-100">
          <div className="grid grid-cols-4 p-2">
            <div className="font-bold text-s">Description</div>
            <div className="font-bold text-center">Dates</div>
            <div className="font-bold text-center">Rate</div>
            <div className="font-bold text-center">Amount</div>
          </div>
        </div>

        {data.items.map((item, index) => (
          <div key={index} className="last:border-b-0">
            <div className="grid grid-cols-4 p-2 min-h-[60px]">
              <div className="pr-2">
                <div className="font-semibold">{item.description}</div>
                {item.serviceType && (
                  <div className="text-xs text-gray-600">
                    {item.serviceType}
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {item.dates && item.dates.length > 0 ? (
                  item.dates.map((d, i) => <div key={i}>• {d}</div>)
                ) : (
                  <div className="text-xs text-gray-400">-</div>
                )}
              </div>
              <div className="text-center flex items-center justify-center">
                {item.rate > 0 ? `₹ ${item.rate.toLocaleString()}` : "-"}
              </div>
              <div className="text-center flex items-center justify-center font-semibold">
                {typeof item.amount === 'number' ? `₹ ${item.amount.toLocaleString()}/-` : '-'}
              </div>
            </div>
          </div>
        ))}

        {}
        {data.schedule && data.schedule.length > 0 && (
          <div className="mt-4 p-2 border-t border-gray-200">
            <div className="font-bold mb-2">Schedule</div>
            <div className="text-sm text-gray-700">
              {data.schedule.map((s, i) => (
                <div key={i} className="mb-2">
                  <div className="font-semibold">
                    {s.type || `Service ${i + 1}`}
                  </div>
                  {s.serviceGiven && (
                    <div className="text-xs">Service: {s.serviceGiven}</div>
                  )}
                  <div className="text-xs">Date: {s.date || "N/A"}</div>
                  <div className="text-xs">
                    Time: {s.startTime || "-"} - {s.endTime || "-"}
                  </div>
                  <div className="text-xs">
                    Venue: {s.venue?.name || ""}{" "}
                    {s.venue?.address ? `- ${s.venue.address}` : ""}
                  </div>
                  <div className="text-xs">
                    Qty: {s.quantity ?? 0} × Price:{" "}
                    {s.price ? `₹ ${s.price.toLocaleString()}` : "-"} = ₹{" "}
                    {Number(s.amount ?? 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-b border-gray-300">
          <div className="grid grid-cols-3 p-2 h-[60px]"></div>
        </div>
      </div>

      {}
      <div className="border border-gray-300 mb-6">
        <div className="bg-gray-100 p-2 text-sm">
          <div>Video Output: {data.videoOutput || "N/A"}</div>
          <div>Photo Output: {data.photoOutput || "N/A"}</div>
          <div>Raw Output: {data.rawOutput || "N/A"}</div>
        </div>
      </div>

      {}
      <div
        className="grid grid-cols-2 gap-6"
        style={{
          position: "absolute",
          bottom: 15,
          left: 0,
          width: "100%",
          background: "white",
        }}
      >
        {}
        <div>
          <div className="bg-gray-100 p-2 font-bold text-center border border-gray-300">
            Terms & Condition Apply
          </div>
          <div className="border border-gray-300 border-t-0 p-3 text-xs">
            <ol className="list-decimal list-inside space-y-1">
              <li>80% Advance Payment required in advance.</li>
              <li>
                Transportation & other local expenses will be borne by the
                Customer.
              </li>
              <li>Equipment failure for any type of Technical Problem.</li>
              <li>Natural disaster will not be our responsibility.</li>
              <li>Working Day & Night charges will vary.</li>
              <li>
                For better Output Corporate All Event Member & Booth Locating &
                Lighting and decoration should be managed by customer & will not
                be our final.
              </li>
              <li>
                If any damage occurs during the period of working the party will
                be responsible for that.
              </li>
              <li>Subject to Muzaffarpur Jurisdiction.</li>
            </ol>
          </div>
        </div>

        {}
        <div>
          <div className="space-y-2">
            <div className="flex justify-between font-bold text-lg border-b pb-2">
              <span>Total</span>
              <span>₹ {data.total.toLocaleString()}/-</span>
            </div>

            <div className="bg-gray-100 p-3 border border-gray-300">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Back Dues</div>
                <div className="text-right">
                  ₹{data.backDues?.toLocaleString() || "0"}/-
                </div>
                <div>Current Dues</div>
                <div className="text-right">
                  ₹ {data.currentDues?.toLocaleString() || "0"}/-
                </div>
                <div className="font-bold border-t pt-1">Total Dues</div>
                <div className="text-right font-bold border-t pt-1">
                  ₹ {data.totalDues?.toLocaleString() || "0"}/-
                </div>
              </div>
            </div>

            <div className="text-xs mt-4">
              <div className="font-bold">Bank Details:</div>
              <div>Name: Abeer Motion Picture Pvt. Ltd.</div>
              <div>A/C No.: 50100158433</div>
              <div>IFSC: HDFC0003716</div>
              <div>Branch: Brahampura, Muzaffarpur</div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="flex justify-end mt-8">
        <div className="text-center">
          <div className="w-24 h-16 flex items-center justify-center mb-2">
            <div className="w-8 h-8 flex items-center justify-center text-white font-bold text-sm"></div>
          </div>
          <div className="text-sm font-semibold">Authorized Signature</div>
        </div>
      </div>

      {}
      <div
        className="text-center text-xs text-gray-600 border-t pt-2"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          background: "white",
        }}
      >
        Note: For excellent photo and video results, the cooperation of all
        members is essential, along with good decoration, proper lighting, and
        an ideal location.
      </div>
    </div>
  );
});

QuotationPDFTemplate.displayName = "QuotationPDFTemplate";

export default QuotationPDFTemplate;
