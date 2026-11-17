import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminSellerApi, SellerProfileData } from '../../api/identityApi.js';
import {
  ShieldCheck,
  Search,
  Filter,
  Store,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Loader2,
  Eye,
} from 'lucide-react';

export const SellerApplicationsQueuePage: React.FC = () => {
  const [applications, setApplications] = useState<SellerProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params: any = { page, limit: 15 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.sellerType = typeFilter;

      const response = await adminSellerApi.listApplications(params);
      if (response.success && response.data) {
        setApplications(response.data);
        if (response.meta?.pagination) {
          setTotalPages(response.meta.pagination.totalPages || 1);
        }
      } else {
        setErrorMessage(response.message || 'Failed to fetch verification queue.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Access denied or server communication error.');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Client-side search filtering
  const filteredApps = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.businessName.toLowerCase().includes(query) ||
      app.businessRegistrationNumber.toLowerCase().includes(query) ||
      app.storeSlug.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'UNDER_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case 'ADDITIONAL_INFO_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
            <HelpCircle className="w-3 h-3" /> Info Requested
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
            <AlertTriangle className="w-3 h-3" /> Suspended
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto my-6 space-y-6">
      {/* Workstation Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-blue-600">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Module 01 Administration</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Seller Verification Workstation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit merchant business registrations, physical/online store credentials, and bank settlement accounts.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg flex items-center gap-2"
        >
          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-medium border-b border-slate-100">
          {[
            { id: 'ALL', label: 'All Applications' },
            { id: 'PENDING', label: 'Pending Review' },
            { id: 'UNDER_VERIFICATION', label: 'Under Review' },
            { id: 'ADDITIONAL_INFO_REQUIRED', label: 'Info Requested' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by business name or BR..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by store type"
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Store Models</option>
              <option value="PHYSICAL_STORE">Physical Retail Store</option>
              <option value="ONLINE_ONLY">Online-Only Merchant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            <span className="text-xs">Loading application queue...</span>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm font-semibold text-slate-700">No seller applications found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your status or search filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Business & Store Slug</th>
                  <th className="py-3 px-4">Operating Model</th>
                  <th className="py-3 px-4">BR Number</th>
                  <th className="py-3 px-4">Operating City / District</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => {
                  const isPhysical = app.sellerType === 'PHYSICAL_STORE';
                  return (
                    <tr key={app.sellerId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{app.businessName}</div>
                        <div className="text-[11px] text-slate-400">autodock.lk/{app.storeSlug}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          {isPhysical ? (
                            <>
                              <Store className="w-3.5 h-3.5 text-blue-600" /> Physical Store
                            </>
                          ) : (
                            <>
                              <Globe className="w-3.5 h-3.5 text-emerald-600" /> Online Only
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {app.businessRegistrationNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {app.operatingAddress.city}, {app.operatingAddress.district}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(app.verificationStatus)}</td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/sellers/${app.sellerId}/review`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review Dossier</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-300 rounded bg-white disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border border-slate-300 rounded bg-white disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
