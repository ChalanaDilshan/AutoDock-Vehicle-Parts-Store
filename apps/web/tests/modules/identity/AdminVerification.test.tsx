// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SellerApplicationsQueuePage } from '../../../src/modules/identity/pages/admin/SellerApplicationsQueuePage.js';
import { SellerApplicationReviewPage } from '../../../src/modules/identity/pages/admin/SellerApplicationReviewPage.js';
import { adminSellerApi, SellerProfileData } from '../../../src/modules/identity/api/identityApi.js';

// Mock adminSellerApi
vi.mock('../../../src/modules/identity/api/identityApi.js', () => {
  return {
    adminSellerApi: {
      listApplications: vi.fn(),
      getApplicationDetail: vi.fn(),
      reviewApplication: vi.fn(),
      verifyBankDetails: vi.fn(),
      getDocumentViewUrl: vi.fn(),
    },
  };
});

describe('MOD-01 Administrator Verification Workstation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAppList: SellerProfileData[] = [
    {
      sellerId: 'sel_01',
      businessName: 'Colombo Brake Specialists',
      storeSlug: 'colombo-brake',
      sellerType: 'PHYSICAL_STORE',
      businessRegistrationNumber: 'PV-10101',
      operatingAddress: {
        street: '12 Panchikawatte Rd',
        city: 'Colombo',
        district: 'Colombo',
        province: 'Western',
        postalCode: '01000',
      },
      contactPhone: '+94112000001',
      verificationStatus: 'PENDING',
      isEligibleToSell: false,
    },
    {
      sellerId: 'sel_02',
      businessName: 'Lanka Online Parts Hub',
      storeSlug: 'lanka-online-hub',
      sellerType: 'ONLINE_ONLY',
      businessRegistrationNumber: 'PV-20202',
      operatingAddress: {
        street: '88 Negombo Rd',
        city: 'Ja-Ela',
        district: 'Gampaha',
        province: 'Western',
        postalCode: '11350',
      },
      contactPhone: '+94112000002',
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    },
  ];

  it('Renders seller applications queue with store type badges and status filters', async () => {
    vi.mocked(adminSellerApi.listApplications).mockResolvedValue({
      success: true,
      data: mockAppList,
      meta: {
        pagination: { total: 2, page: 1, limit: 15, totalPages: 1 },
      },
    });

    render(
      <MemoryRouter>
        <SellerApplicationsQueuePage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Colombo Brake Specialists')).toBeDefined();
    expect(screen.getByText('Lanka Online Parts Hub')).toBeDefined();

    expect(screen.getByText('PV-10101')).toBeDefined();
    expect(screen.getByText('PV-20202')).toBeDefined();

    // Verify filter tabs exist
    expect(screen.getByRole('button', { name: /Pending Review/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Approved/i })).toBeDefined();

    // Filter by pending review
    fireEvent.click(screen.getByRole('button', { name: /Pending Review/i }));
    expect(adminSellerApi.listApplications).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING' })
    );
  });

  it('Renders detailed application dossier with confidential document inspection and bank details', async () => {
    const singleDossier: SellerProfileData = {
      sellerId: 'sel_01',
      businessName: 'Colombo Brake Specialists',
      storeSlug: 'colombo-brake',
      sellerType: 'PHYSICAL_STORE',
      businessRegistrationNumber: 'PV-10101',
      operatingAddress: {
        street: '12 Panchikawatte Rd',
        city: 'Colombo',
        district: 'Colombo',
        province: 'Western',
        postalCode: '01000',
      },
      contactPhone: '+94112000001',
      verificationStatus: 'PENDING',
      isEligibleToSell: false,
      user: {
        firstName: 'Dilan',
        lastName: 'Fernando',
        email: 'dilan@colombobrake.lk',
        phone: '+94771234567',
      },
      documents: [
        {
          documentId: 'doc_br_01',
          documentType: 'BUSINESS_REGISTRATION',
          fileName: 'BR_Certificate_ColomboBrake.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 1024 * 1024,
          reviewStatus: 'PENDING',
          createdAt: new Date().toISOString(),
        },
      ],
      bankDetails: {
        bankName: 'Commercial Bank of Ceylon',
        accountHolderName: 'Colombo Brake Specialists (Pvt) Ltd',
        maskedAccountNumber: '******8471',
        branchName: 'Panchikawatte',
        verificationStatus: 'PENDING',
      },
      verificationHistory: [],
    };

    vi.mocked(adminSellerApi.getApplicationDetail).mockResolvedValue({
      success: true,
      data: singleDossier,
    });

    render(
      <MemoryRouter initialEntries={['/admin/sellers/sel_01/review']}>
        <Routes>
          <Route path="/admin/sellers/:id/review" element={<SellerApplicationReviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Colombo Brake Specialists' })).toBeDefined();
    expect(screen.getByText('Dilan Fernando')).toBeDefined();
    expect(screen.getByText('BR_Certificate_ColomboBrake.pdf')).toBeDefined();
    expect(screen.getByText('******8471')).toBeDefined();
    expect(screen.getByText('Inspect Document')).toBeDefined();
    expect(screen.getByText('Audit Bank')).toBeDefined();
    expect(screen.getByText(/Record Verification Decision/i)).toBeDefined();
  });
});
