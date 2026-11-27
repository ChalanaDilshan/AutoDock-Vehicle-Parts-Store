import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { adminPlatformApi } from '../api/adminPlatformApi.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';
import {
  Alert,
  Button,
  Input,
  PageHeader,
} from '../../../shared/components/index.js';

interface ReportDefinition {
  reportType: string;
  title: string;
  description: string;
}

const REPORT_CATALOGUE: ReportDefinition[] = [
  {
    reportType: 'sales-velocity',
    title: 'Multi-Vendor Sales Velocity',
    description: 'Order volume, GMV totals, and average basket value in LKR',
  },
  {
    reportType: 'seller-verification',
    title: 'Seller Verification SLA',
    description: 'Onboarding queue turnaround times and approval breakdown',
  },
  {
    reportType: 'commission-aging',
    title: 'Commission Aging & Receivables',
    description: 'Outstanding seller invoice balances and settlement periods',
  },
  {
    reportType: 'delivery-coverage',
    title: 'District Delivery Coverage',
    description: 'Approved merchant delivery zones and shipping rates by district',
  },
  {
    reportType: 'audit-activity',
    title: 'Security & Compliance Activity',
    description: 'Volume of administrative actions grouped by module and severity',
  },
];

export const AdminReportsPage: React.FC = () => {
  const [selectedReportType, setSelectedReportType] =
    useState<string>('sales-velocity');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReport = async (type = selectedReportType) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminPlatformApi.getReport(type, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.success && Array.isArray(res.data)) {
        setRows(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to generate platform report.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport(selectedReportType);
  }, [selectedReportType]);

  const handleDownloadCsv = async () => {
    setIsDownloading(true);
    setErrorMessage(null);
    try {
      await adminPlatformApi.downloadReportCsv(selectedReportType, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to download CSV report.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatCell = (key: string, val: unknown, row: Record<string, any>) => {
    if (
      typeof val === 'number' &&
      (row.currency === 'LKR' || key.toLowerCase().includes('cents'))
    ) {
      return formatLKR(val);
    }
    return String(val ?? '—');
  };

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consolidated Platform Reports"
        subtitle="Generate operational summaries across sales, seller compliance, and settlements"
        actions={
          <Button
            variant="primary"
            size="sm"
            isLoading={isDownloading}
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleDownloadCsv}
          >
            Download CSV
          </Button>
        }
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {/* Report Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {REPORT_CATALOGUE.map((r) => {
          const active = r.reportType === selectedReportType;
          return (
            <button
              key={r.reportType}
              type="button"
              onClick={() => setSelectedReportType(r.reportType)}
              className={`text-left rounded-lg border p-3.5 transition-colors ${
                active
                  ? 'border-[#E11D30] bg-red-50/50 text-slate-900'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="text-xs font-semibold">{r.title}</div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                {r.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Date Range Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-44">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => loadReport(selectedReportType)}>
          Apply Window
        </Button>
        <span className="text-xs text-slate-500 sm:ml-auto">
          Result Dataset: {rows.length} Records
        </span>
      </div>

      {/* Results Table */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Generating report dataset...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center space-y-2 text-slate-500 text-sm">
            <FileSpreadsheet className="w-6 h-6 mx-auto text-slate-400" />
            <p>No matching records in this reporting window.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  {columns.map((col) => (
                    <th key={col} className="py-3 px-4">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    {columns.map((col) => (
                      <td key={col} className="py-3 px-4 text-slate-800">
                        {formatCell(col, row[col], row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
