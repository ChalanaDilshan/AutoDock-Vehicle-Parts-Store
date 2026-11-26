import React from 'react';
import { Button, Modal } from '../../../shared/components/index.js';
import { CURRENT_PRIVACY_NOTICE_VERSION } from '../constants/privacy.constants.js';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  version?: string;
}

export const PRIVACY_NOTICE_V1_2_TEXT = `
AUTODOCK SELLER PRIVACY NOTICE (Version 1.2)

1. Purpose of Collection:
AutoDock collects merchant identity documents (Business Registration Certificate, National Identity Card or Passport, Live Facial Images), operating location information, and financial disbursement details strictly for:
  a) Verifying lawful commercial entity authorization to vend automotive spare parts.
  b) Mitigating fraudulent counterfeit parts circulation across the Sri Lankan marketplace.
  c) Routing direct-to-seller customer bank transfers and managing marketplace commission settlement records.

2. Confidentiality & Restricted Access:
Identity verification documents and bank details are classified as Strictly Confidential. They are:
  - Stored with restricted access controls.
  - Accessible solely to authorized Platform Administrators during onboarding review.
  - Never displayed publicly on storefront pages or customer emails.
`;

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
  version = CURRENT_PRIVACY_NOTICE_VERSION,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`AutoDock Seller Privacy Notice (${version})`}
      size="md"
      footer={
        <Button variant="primary" size="sm" onClick={onClose}>
          Close Notice
        </Button>
      }
    >
      <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
        {PRIVACY_NOTICE_V1_2_TEXT.trim()}
      </pre>
    </Modal>
  );
};
