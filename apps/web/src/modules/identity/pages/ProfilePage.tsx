import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { authApi } from '../api/identityApi.js';
import {
  Alert,
  Badge,
  Button,
  Input,
  PageHeader,
} from '../../../shared/components/index.js';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'danger';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setStatusMessage({
        type: 'danger',
        text: 'First name, last name, and contact phone are required.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await authApi.updateMe({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
      await refreshProfile();
      setStatusMessage({
        type: 'success',
        text: 'Profile details saved.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'danger',
        text: err?.message || 'Unable to update your profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <PageHeader
        title="Account Profile"
        subtitle="Manage your personal contact details and view account status"
        badge={
          user?.role ? (
            <Badge variant="primary">{user.role}</Badge>
          ) : undefined
        }
      />

      {statusMessage && (
        <Alert variant={statusMessage.type}>{statusMessage.text}</Alert>
      )}

      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
        <div className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Registered Email</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">
              {user?.email}
            </p>
          </div>
          <Badge variant={user?.accountStatus === 'ACTIVE' ? 'success' : 'warning'}>
            {user?.accountStatus || 'ACTIVE'}
          </Badge>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
