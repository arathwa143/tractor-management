import { formatINR } from "@/lib/calculations";

interface JobReceiptProps {
  job: {
    bookingNumber?: string;
    farmerName: string;
    farmerPhone: string;
    village: string;
    serviceType: string;
    billingMethod: string;
    area?: number;
    areaUnit?: string;
    hoursWorked?: number;
    ratePaise: number;
    totalAmountPaise: number;
    completedAt: string;
  };
  paidAmount: number; // In Rupees
}

export function JobReceipt({ job, paidAmount }: JobReceiptProps) {
  const totalRupees = job.totalAmountPaise / 100;
  const balance = totalRupees - paidAmount;

  return (
    <div className="bg-white p-8 max-w-2xl mx-auto border border-gray-200 shadow-sm print:shadow-none print:border-none">
      {/* Header */}
      <div className="text-center border-b-2 border-primary pb-4 mb-6">
        <h1 className="text-3xl font-bold text-primary">TractorPro Services</h1>
        <p className="text-sm text-gray-600 mt-1">Professional Agricultural Machinery Services</p>
        <p className="text-xs text-gray-500">Contact: +91 99999 99999 | Gujarat, India</p>
      </div>

      {/* Receipt Meta */}
      <div className="flex justify-between mb-6 text-sm">
        <div>
          <p className="font-bold text-gray-700">Bill To:</p>
          <p className="text-lg font-semibold">{job.farmerName}</p>
          <p className="text-gray-600">{job.village}</p>
          <p className="text-gray-600">Ph: {job.farmerPhone}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-700">Receipt Details:</p>
          <p className="text-gray-600">Date: {new Date(job.completedAt).toLocaleDateString('en-IN')}</p>
          <p className="text-gray-600">Job #: {job.bookingNumber || "WALK-IN"}</p>
          <p className="text-gray-600">Service: {job.serviceType}</p>
        </div>
      </div>

      {/* Service Table */}
      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b-2 border-gray-300">
            <th className="text-left p-2 text-sm font-bold">Description</th>
            <th className="text-right p-2 text-sm font-bold">Qty / Hours</th>
            <th className="text-right p-2 text-sm font-bold">Rate</th>
            <th className="text-right p-2 text-sm font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="p-2 text-sm">
              {job.serviceType} Service 
              {job.billingMethod === 'area' ? ` (${job.areaUnit || 'Bigha'})` : ' (Hourly)'}
            </td>
            <td className="p-2 text-sm text-right">
              {job.billingMethod === 'area' ? job.area : job.hoursWorked}
            </td>
            <td className="p-2 text-sm text-right">{formatINR(job.ratePaise)}</td>
            <td className="p-2 text-sm text-right font-bold">{formatINR(job.totalAmountPaise)}</td>
          </tr>
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatINR(job.totalAmountPaise)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount Paid:</span>
            <span className="font-medium text-green-600">{formatINR(paidAmount * 100)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t-2 border-primary pt-2">
            <span>Balance Due:</span>
            <span className={balance > 0 ? "text-red-600" : "text-green-600"}>
              {formatINR(balance * 100)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-500">
        <p>Thank you for your business!</p>
        <p className="text-right">Authorized Signatory<br/>___________________</p>
      </div>
    </div>
  );
}