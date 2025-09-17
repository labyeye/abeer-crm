import { forwardRef } from "react";
import logo from "../../images/logo.png";
interface QuotationItem {
  description: string;
  rate: number;
  amount: number;
  dates?: string[];
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
      className="bg-white p-8 font-sans relative"
      style={{ width: "210mm", minHeight: "297mm", position: "relative" }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        {/* Company Logo and Info */}
        <div className="flex items-center">
          <img src={logo} alt="Company Logo" className="w-32 h-32 mr-4" />
          <div>
            <h1 className="text-lg font-bold">Name: {data.client.name}</h1>
            <p className="text-sm">Address: {data.client.address}</p>
            <p className="text-sm">Contact No.: {data.client.contact}</p>
            {data.client.gstin && (
              <p className="text-sm">GST No.: {data.client.gstin}</p>
            )}
          </div>
        </div>

        {/* Invoice Details */}
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
          <div className="mt-2 border-t pt-2">
            <div className="font-bold">
              Received Amount: ₹ {data.receivedAmount?.toLocaleString() || "0"}
              /-
            </div>
            <div className="text-xs text-gray-600">
              (In Jan. 25, to Feb. 25, of April 25)
            </div>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className=" mb-6">
        <div className="bg-gray-100">
          <div className="grid grid-cols-3 p-2">
            <div className="font-bold text-s text-center">Description</div>
            <div className="font-bold text-center">Rate</div>
            <div className="font-bold text-center">Amount</div>
          </div>
        </div>

        {data.items.map((item, index) => (
          <div key={index} className="last:border-b-0">
            <div className="grid grid-cols-3 p-2 min-h-[60px]">
              <div className="pr-2">
                <div className="font-semibold">{item.description}</div>
                {item.dates && (
                  <div className="text-xs text-gray-600 mt-1">
                    {item.dates.map((date, i) => (
                      <div key={i}>• {date}</div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-center flex items-center justify-center">
                {item.rate > 0 ? `₹ ${item.rate.toLocaleString()}` : "-"}
              </div>
              <div className="text-center flex items-center justify-center font-semibold">
                ₹ {item.amount.toLocaleString()}/-
              </div>
            </div>
          </div>
        ))}

        <div className="border-b border-gray-300">
          <div className="grid grid-cols-3 p-2 h-[60px]"></div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="border border-gray-300 mb-6">
        <div className="bg-gray-100 p-2 text-sm">
            <div>Video Output: {data.videoOutput || 'N/A'}</div>
            <div>Photo Output: {data.photoOutput || 'N/A'}</div>
            <div>Raw Output: {data.rawOutput || 'N/A'}</div>
        </div>
      </div>

      {/* Footer Section */}
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
        {/* Terms and Conditions */}
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

        {/* Payment Details */}
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

      {/* Signature */}
      <div className="flex justify-end mt-8">
        <div className="text-center">
          <div className="w-24 h-16 flex items-center justify-center mb-2">
            <div className="w-8 h-8 flex items-center justify-center text-white font-bold text-sm"></div>
          </div>
          <div className="text-sm font-semibold">Authorized Signature</div>
        </div>
      </div>

      {/* Footer Note - Fixed to Bottom */}
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
