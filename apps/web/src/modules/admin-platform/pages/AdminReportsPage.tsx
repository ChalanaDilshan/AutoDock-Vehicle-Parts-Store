import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Truck,
  History,
} from 'lucide-react';
import { adminPlatformApi, ReportCatalogueItem } from '../api/adminPlatformApi.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';

export const AdminReportsPage: React.FC = () => {
  const [selectedReportType, setSelectedReportType] = useState<string>('sales-velocity');
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportName, setReportName] = useState<string>('Platform Report');
  const [recordCount, setRecordCount] = useState<number>(0);

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sellerId, setSellerId] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const reportCatalogue: ReportCatalogueItem[] = [
    {
      reportType: 'sales-velocity',
      title: 'Multi-Vendor Sales Velocity',
      description: 'Gross merchandise value, logistics revenue split, and customer master orders vs merchant suborders ratio.',
      primaryModule: 'MOD-03',
      exportable: true,
      supportedFilters: ['Date Range', 'Merchant ID'],
    },
    {
      reportType: 'seller-verification',
      title: 'Seller Verification SLA',
      description: 'Merchant onboarding turnaround, document validation rates, and physical store inspection compliance.',
      primaryModule: 'MOD-01',
      exportable: true,
      supportedFilters: ['Date Range', 'Status'],
    },
    {
      reportType: 'commission-aging',
      title: 'Commission Aging & Receivables',
      description: 'Platform commission invoiced, collected, aging overdue buckets, and bank slip settlement backlogs.',
      primaryModule: 'MOD-04',
      exportable: true,
      supportedFilters: ['Billing Period', 'Seller ID'],
    },
    {
      reportType: 'delivery-coverage',
      title: 'District Delivery Coverage',
      description: 'Island-wide logistics distribution, rate card spreads across 25 Sri Lankan districts, and seller coverage.',
      primaryModule: 'MOD-03',
      exportable: true,
      supportedFilters: ['District', 'Seller ID'],
    },
    {
      reportType: 'audit-activity',
      title: 'Security & Compliance Activity',
      description: 'Privileged administrative operations, role mutations, data exports, and security event distribution.',
      primaryModule: 'MOD-05',
      exportable: true,
      supportedFilters: ['Date Range', 'Severity'],
    },
  ];

  const fetchReport = async (reportType: string = selectedReportType) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await adminPlatformApi.getReport(reportType, {
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        sellerId: sellerId.trim() || undefined,
      });

      if (res.success && res.data) {
        setReportData(res.data);
        setReportName(
          reportCatalogue.find((r) => r.reportType === reportType)?.title || reportType
        );
        setRecordCount(res.meta?.recordCount || res.data.length);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate platform report.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedReportType);
  }, [selectedReportType]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport(selectedReportType);
  };

  const handleDownloadCsv = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await adminPlatformApi.downloadReportCsv(selectedReportType, {
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        sellerId: sellerId.trim() || undefined,
      });
      setSuccessMessage(`CSV export for ${reportName} initiated. Compliance audit event recorded.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to download report CSV export.');
    } finally {
      setIsExporting(false);
    }
  };

  const getModuleIcon = (mod: string) => {
    switch (mod) {
      case 'MOD-01': return ShieldCheck;
      case 'MOD-03': return Truck;
      case 'MOD-04': return DollarSign;
      case 'MOD-05': return History;
      default: return FileBarChart;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            Consolidated Platform Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-module operational intelligence, financial receivables, island-wide logistics, and compliance audits.
          </p>
        </div>

        {/* CSV Export Action */}
        <button
          type="button"
          onClick={handleDownloadCsv}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 shrink-0"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Download className="w-4 h-4 text-white" />
          )}
          <span>Download CSV (PII Redacted)</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Report Catalogue Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {reportCatalogue.map((report) => {
          const isSelected = selectedReportType === report.reportType;
          const Icon = getModuleIcon(report.primaryModule);

          return (
            <button
              key={report.reportType}
              type="button"
              onClick={() => setSelectedReportType(report.reportType)}
              className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-blue-800 text-blue-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {report.primaryModule}
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold leading-tight line-clamp-1">
                    {report.title}
                  </h3>
                  <p
                    className={`text-[11px] mt-1 line-clamp-2 ${
                      isSelected ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {report.description}
                  </p>
                </div>
              </div>

              <div
                className={`mt-3 pt-2 border-t text-[10px] font-bold flex items-center justify-between ${
                  isSelected ? 'border-blue-500 text-blue-100' : 'border-slate-100 text-blue-600'
                }`}
              >
                <span>Select Report</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Workstation for Current Report */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Report Parameters & Filters: {reportName}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Audit Logging Active</span>
          </div>
        </div>

        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-600">Start Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">End Date:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Seller ID:</span>
            <input
              type="text"
              placeholder="Optional Merchant ID"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs w-36 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Render Report Data Table */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Aggregating cross-module dataset...</span>
        </div>
      ) : reportData.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">No records returned</h3>
          <p className="text-xs text-slate-400">Try adjusting the reporting date range or merchant filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Result Dataset: {recordCount} Records</span>
            <span className="text-[11px] text-slate-400 font-normal">
              Currency Basis: Sri Lankan Rupees (LKR)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                <tr>
                  {Object.keys(reportData[0]).map((colKey) => (
                    <th key={colKey} className="py-3 px-4 capitalize">
                      {colKey.replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reportData.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50/60">
                    {Object.keys(row).map((colKey) => {
                      const val = row[colKey];
                      const isMoney =
                        colKey.toLowerCase().includes('cents') ||
                        colKey.toLowerCase().includes('revenue') ||
                        colKey.toLowerCase().includes('value');

                      return (
                        <td key={colKey} className="py-3 px-4 font-mono text-[11px]">
                          {typeof val === 'number' && isMoney ? (
                            <span className="font-bold text-slate-900">
                              {formatLKR(val)}
                            </span>
                          ) : typeof val === 'object' && val !== null ? (
                            JSON.stringify(val)
                          ) : (
                            String(val ?? '')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
