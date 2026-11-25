import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import { adminSellerApi, SellerProfileData } from '../../api/identityApi.js';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  PageHeader,
} from '../../../../shared/components/index.js';

export const SellerApplicationsQueuePage: React.FC = () => {
  const [applications, setApplications] = useState<SellerProfileData[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadApplications = async (status?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminSellerApi.listApplications({
        status: status || undefined,
        limit: 25,
      });
      if (res.success && Array.isArray(res.data)) {
        setApplications(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load seller applications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications(statusFilter);
  }, [statusFilter]);

  const filterTabs = [
    { value: '', label: 'All Applications' },
    { value: 'PENDING', label: 'Pending Review' },
    { value: 'UNDER_VERIFICATION', label: 'Under Verification' },
    { value: 'ADDITIONAL_INFO_REQUIRED', label: 'Info Requested' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') return <Badge variant="success">Approved</Badge>;
    if (status === 'REJECTED' || status === 'SUSPENDED')
      return <Badge variant="danger">{status}</Badge>;
    if (status === 'PENDING' || status === 'UNDER_VERIFICATION')
      return <Badge variant="warning">{status.replace(/_/g, ' ')}</Badge>;
    return <Badge variant="default">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seller Verification Queue"
        subtitle="Review merchant business registrations, store photos, and bank details"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-64 bg-white border border-slate-200 rounded-lg" />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title="No seller applications found"
          description="Submitted seller verification dossiers matching this filter will appear here."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Business Name</th>
                  <th className="py-3 px-4">BR Number</th>
                  <th className="py-3 px-4">Store Model</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {applications.map((app) => (
                  <tr key={app.sellerId} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {app.businessName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {app.businessRegistrationNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {app.sellerType === 'PHYSICAL_STORE'
                        ? 'Physical Store'
                        : 'Online-Only'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {app.operatingAddress.city}, {app.operatingAddress.district}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(app.verificationStatus)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/admin/sellers/${app.sellerId}/review`}>
                        <Button
                          variant="outline"
                          size="sm"
                          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                        >
                          Review
                        </Button>
                      </Link>
                    </td>
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
