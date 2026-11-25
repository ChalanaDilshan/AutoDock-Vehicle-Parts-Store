// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { StoreTypeSelector } from '../../../src/modules/identity/components/StoreTypeSelector.js';
import { DocumentDropzone } from '../../../src/modules/identity/components/DocumentDropzone.js';
import { SellerOnboardingHub } from '../../../src/modules/identity/pages/seller/SellerOnboardingHub.js';
import { RestrictedSellerDashboard } from '../../../src/modules/identity/pages/seller/RestrictedSellerDashboard.js';
import { sellerApi, SellerProfileData } from '../../../src/modules/identity/api/identityApi.js';

// Mock sellerApi
vi.mock('../../../src/modules/identity/api/identityApi.js', () => {
  return {
    sellerApi: {
      getMe: vi.fn(),
      getDocuments: vi.fn(),
      uploadDocument: vi.fn(),
      submitBankDetails: vi.fn(),
      acknowledgePrivacy: vi.fn(),
      submitApplication: vi.fn(),
    },
  };
});

describe('MOD-01 Seller Onboarding & Restricted Experience Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('StoreTypeSelector renders Physical and Online models with respective verification requirements', () => {
    const handleChange = vi.fn();
    render(
      <StoreTypeSelector
        value="PHYSICAL_STORE"
        onChange={handleChange}
      />
    );

    expect(screen.getByText(/Physical Retail Store/i)).toBeDefined();
    expect(screen.getByText(/Online-Only Merchant/i)).toBeDefined();
    expect(screen.getByText(/Physical Storefront & Workshop Photos/i)).toBeDefined();
    expect(screen.getByText(/Storefront photos NOT required/i)).toBeDefined();

    const onlineCard = screen.getByText(/Online-Only Merchant/i);
    fireEvent.click(onlineCard);
    expect(handleChange).toHaveBeenCalledWith('ONLINE_ONLY');
  });

  it('SellerOnboardingHub conditionally hides storefront upload for ONLINE_ONLY store', async () => {
    const mockOnlineSeller: SellerProfileData = {
      sellerId: 'seller_123',
      businessName: 'Apex Online Spares',
      storeSlug: 'apex-online-spares',
      sellerType: 'ONLINE_ONLY',
      businessRegistrationNumber: 'PV-98765',
      operatingAddress: {
        street: '12 Warehouse Way',
        city: 'Wattala',
        district: 'Gampaha',
        province: 'Western',
        postalCode: '11300',
      },
      contactPhone: '+94112345678',
      verificationStatus: 'DRAFT',
      isEligibleToSell: false,
      hasPrivacyAcknowledgement: false,
    };

    vi.mocked(sellerApi.getMe).mockResolvedValue({
      success: true,
      data: mockOnlineSeller,
    });

    vi.mocked(sellerApi.getDocuments).mockResolvedValue({
      success: true,
      data: [],
    });

    render(
      <MemoryRouter>
        <SellerOnboardingHub />
      </MemoryRouter>
    );

    expect(await screen.findByText('Apex Online Spares')).toBeDefined();
    expect(screen.getAllByText(/Online-Only Merchant/i).length).toBeGreaterThan(0);

    // Verify storefront photos NOT required notice appears
    expect(screen.getByText(/Storefront Photos Not Required/i)).toBeDefined();
    expect(screen.queryByLabelText(/Physical Storefront & Workshop Photographs/i)).toBeNull();

    // Verify privacy checkbox starts unchecked
    const privacyCheckbox = screen.getByLabelText(/AutoDock Seller Privacy Notice \(Version 1\.2\)/i) as HTMLInputElement;
    expect(privacyCheckbox.checked).toBe(false);

    // Verify final submit button is disabled
    const submitBtn = screen.getByRole('button', { name: /Submit Application for Administrative Verification/i });
    expect(submitBtn.hasAttribute('disabled')).toBe(true);
  });

  it('SellerOnboardingHub enforces all 4 documents for PHYSICAL_STORE and enables privacy toggle', async () => {
    const mockPhysicalSeller: SellerProfileData = {
      sellerId: 'seller_456',
      businessName: 'Central Auto Workshop',
      storeSlug: 'central-auto',
      sellerType: 'PHYSICAL_STORE',
      businessRegistrationNumber: 'PV-54321',
      operatingAddress: {
        street: '45 Panchikawatte Rd',
        city: 'Colombo',
        district: 'Colombo',
        province: 'Western',
        postalCode: '01000',
      },
      contactPhone: '+94112345678',
      verificationStatus: 'DRAFT',
      isEligibleToSell: false,
      hasPrivacyAcknowledgement: false,
    };

    vi.mocked(sellerApi.getMe).mockResolvedValue({
      success: true,
      data: mockPhysicalSeller,
    });

    vi.mocked(sellerApi.getDocuments).mockResolvedValue({
      success: true,
      data: [],
    });

    vi.mocked(sellerApi.acknowledgePrivacy).mockResolvedValue({
      success: true,
      data: { noticeVersion: 'v1.2', acknowledgedAt: new Date().toISOString() },
    });

    render(
      <MemoryRouter>
        <SellerOnboardingHub />
      </MemoryRouter>
    );

    expect(await screen.findByText('Central Auto Workshop')).toBeDefined();
    // Physical store requires storefront photo dropzone
    expect(screen.getByText(/Physical Storefront & Workshop Photographs/i)).toBeDefined();

    // Test privacy toggle
    const privacyCheckbox = screen.getByLabelText(/AutoDock Seller Privacy Notice \(Version 1\.2\)/i) as HTMLInputElement;
    expect(privacyCheckbox.checked).toBe(false);

    fireEvent.click(privacyCheckbox);
    expect(privacyCheckbox.checked).toBe(true);
    expect(sellerApi.acknowledgePrivacy).toHaveBeenCalledWith({
      noticeVersion: 'v1.2',
      acknowledged: true,
    });
  });

  it('RestrictedSellerDashboard locks catalog publishing for unapproved seller', async () => {
    const mockPendingSeller: SellerProfileData = {
      sellerId: 'seller_789',
      businessName: 'Lanka Spares Mart',
      storeSlug: 'lanka-spares-mart',
      sellerType: 'PHYSICAL_STORE',
      businessRegistrationNumber: 'PV-112233',
      operatingAddress: {
        street: '100 Kandy Rd',
        city: 'Kelaniya',
        district: 'Gampaha',
        province: 'Western',
        postalCode: '11600',
      },
      contactPhone: '+94112345678',
      verificationStatus: 'PENDING',
      isEligibleToSell: false,
    };

    vi.mocked(sellerApi.getMe).mockResolvedValue({
      success: true,
      data: mockPendingSeller,
    });

    render(
      <MemoryRouter>
        <RestrictedSellerDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText('Lanka Spares Mart')).toBeDefined();
    expect(screen.getByText(/Restricted Merchant Access — Catalog Publishing Locked/i)).toBeDefined();
    expect(screen.getByText(/Locked pending verification/i)).toBeDefined();
  });

  it('SellerOnboardingHub renders 5-step completion checklist and supports ADDITIONAL_INFO_REQUIRED resubmission', async () => {
    const mockInfoSeller: SellerProfileData = {
      sellerId: 'seller_901',
      businessName: 'Kandy Parts Hub',
      storeSlug: 'kandy-parts-hub',
      sellerType: 'ONLINE_ONLY',
      businessRegistrationNumber: 'PV-77889',
      operatingAddress: {
        street: '20 Peradeniya Rd',
        city: 'Kandy',
        district: 'Kandy',
        province: 'Central',
        postalCode: '20000',
      },
      contactPhone: '+94812345678',
      verificationStatus: 'ADDITIONAL_INFO_REQUIRED',
      additionalInfoRequested: 'Please upload a clearer NIC image.',
      isEligibleToSell: false,
      bankVerificationStatus: 'PENDING',
      privacyAcknowledged: true,
    };

    vi.mocked(sellerApi.getMe).mockResolvedValue({
      success: true,
      data: mockInfoSeller,
    });
    vi.mocked(sellerApi.getDocuments).mockResolvedValue({
      success: true,
      data: [
        {
          documentId: 'd1',
          documentType: 'BUSINESS_REGISTRATION',
          fileName: 'br.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 2048,
          reviewStatus: 'ACCEPTED',
          createdAt: new Date().toISOString(),
        },
        {
          documentId: 'd2',
          documentType: 'SELLER_ID_CARD',
          fileName: 'nic.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 2048,
          reviewStatus: 'REJECTED',
          createdAt: new Date().toISOString(),
        },
        {
          documentId: 'd3',
          documentType: 'SELLER_FACE_PHOTO',
          fileName: 'face.png',
          mimeType: 'image/png',
          fileSizeBytes: 2048,
          reviewStatus: 'ACCEPTED',
          createdAt: new Date().toISOString(),
        },
      ],
    });
    vi.mocked(sellerApi.submitApplication).mockResolvedValue({
      success: true,
      data: {
        sellerId: 'seller_901',
        verificationStatus: 'PENDING',
        isEligibleToSell: false,
      },
    });

    render(
      <MemoryRouter>
        <SellerOnboardingHub />
      </MemoryRouter>
    );

    expect(await screen.findByText('Onboarding Completion Checklist')).toBeDefined();
    expect(screen.getByText('4 of 5 completed')).toBeDefined();
    expect(screen.getByText('Store profile created')).toBeDefined();
    expect(screen.getByText('Required verification documents uploaded')).toBeDefined();
    expect(screen.getByText('3 of 3 required documents uploaded')).toBeDefined();
    expect(screen.getByText('Bank account details saved')).toBeDefined();
    expect(screen.getByText('Privacy notice acknowledged')).toBeDefined();
    expect(screen.getByText('Application submitted')).toBeDefined();
    expect(screen.getByText(/Please upload a clearer NIC image/i)).toBeDefined();

    const submitBtn = screen.getByRole('button', {
      name: /Submit Application for Administrative Verification/i,
    });
    expect(submitBtn.hasAttribute('disabled')).toBe(false);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(sellerApi.submitApplication).toHaveBeenCalledTimes(1);
    });
  });

  it('DocumentDropzone enforces 10MB max, MIME allowlist, and reads real base64 bytes', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    render(
      <DocumentDropzone
        label="Business Registration Certificate"
        description="Upload BR"
        documentType="BUSINESS_REGISTRATION"
        onUpload={onUpload}
      />
    );

    expect(screen.getByText(/PDF, JPG or PNG \(max 10MB\)/i)).toBeDefined();
    const input = screen.getByLabelText(/Business Registration Certificate/i) as HTMLInputElement;

    // Reject unsupported MIME type
    const badMimeFile = new File(['hello world'], 'script.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [badMimeFile] } });
    expect(await screen.findByText(/Unsupported file type/i)).toBeDefined();
    expect(onUpload).not.toHaveBeenCalled();

    // Reject file larger than 10MB
    const bigBytes = new Uint8Array(10 * 1024 * 1024 + 10);
    const oversizedFile = new File([bigBytes], 'huge.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [oversizedFile] } });
    expect(await screen.findByText(/File exceeds 10MB size limit/i)).toBeDefined();
    expect(onUpload).not.toHaveBeenCalled();

    // Accept valid file under 10MB and read real base64 payload
    const validContent = 'PDF_VALID_CONTENT_'.repeat(10);
    const validFile = new File([validContent], 'br-cert.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledTimes(1);
    });
    const callArg = onUpload.mock.calls[0][0];
    expect(callArg.mimeType).toBe('application/pdf');
    expect(callArg.fileSizeBytes).toBe(validContent.length);
    expect(callArg.fileContentBase64.length).toBeGreaterThan(0);
  });

  it('RestrictedSellerDashboard separates Store Approved Bank Pending from Fully Eligible', async () => {
    vi.mocked(sellerApi.getMe).mockResolvedValueOnce({
      success: true,
      data: {
        sellerId: 'seller_approved_bank_pending',
        businessName: 'Galle Auto Traders',
        storeSlug: 'galle-auto-traders',
        sellerType: 'PHYSICAL_STORE',
        businessRegistrationNumber: 'PV-33445',
        operatingAddress: {
          street: '5 Wakwella Rd',
          city: 'Galle',
          district: 'Galle',
          province: 'Southern',
          postalCode: '80000',
        },
        contactPhone: '+94912345678',
        verificationStatus: 'APPROVED',
        isEligibleToSell: false,
        bankDetails: {
          bankName: 'Bank of Ceylon',
          accountHolderName: 'Galle Auto Traders',
          maskedAccountNumber: '******4321',
          branchName: 'Galle',
          verificationStatus: 'PENDING',
        },
      },
    });

    const { rerender } = render(
      <MemoryRouter>
        <RestrictedSellerDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Store Approved, Bank Verification Pending/i)).toBeDefined();
    expect(screen.getByText(/Locked pending bank verification/i)).toBeDefined();

    vi.mocked(sellerApi.getMe).mockResolvedValueOnce({
      success: true,
      data: {
        sellerId: 'seller_eligible',
        businessName: 'Galle Auto Traders',
        storeSlug: 'galle-auto-traders',
        sellerType: 'PHYSICAL_STORE',
        businessRegistrationNumber: 'PV-33445',
        operatingAddress: {
          street: '5 Wakwella Rd',
          city: 'Galle',
          district: 'Galle',
          province: 'Southern',
          postalCode: '80000',
        },
        contactPhone: '+94912345678',
        verificationStatus: 'APPROVED',
        isEligibleToSell: true,
        bankDetails: {
          bankName: 'Bank of Ceylon',
          accountHolderName: 'Galle Auto Traders',
          maskedAccountNumber: '******4321',
          branchName: 'Galle',
          verificationStatus: 'VERIFIED',
        },
      },
    });

    rerender(
      <MemoryRouter key="eligible">
        <RestrictedSellerDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Store Verified & Active/i)).toBeDefined();
    expect(screen.getAllByText(/Available/i).length).toBeGreaterThanOrEqual(4);
  });
});
