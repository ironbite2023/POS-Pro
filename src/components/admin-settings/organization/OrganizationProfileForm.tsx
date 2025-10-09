'use client';

import React, { useState, useEffect } from 'react';
import { Card, Flex, Button, TextField, Text, Heading, Avatar } from '@radix-ui/themes';
import { Save, Upload, AlertCircle } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase/client';
import { adminService } from '@/lib/services/admin.service';
import type { Database } from '@/lib/supabase/database.types';
import { toast } from 'sonner';

type Organization = Database['public']['Tables']['organizations']['Row'];

interface OrganizationSettings {
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
}

export default function OrganizationProfileForm() {
  const { currentOrganization, refreshOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: currentOrganization?.name || '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logoUrl: '',
  });

  // Load organization settings from JSON field
  useEffect(() => {
    if (currentOrganization?.settings) {
      const settings = currentOrganization.settings as OrganizationSettings;
      setFormData(prev => ({
        ...prev,
        name: currentOrganization.name || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        website: settings.website || '',
        logoUrl: settings.logo_url || '',
      }));
    }
  }, [currentOrganization]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleImageUpload = async (file: File) => {
    if (!currentOrganization) return;

    setUploading(true);
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `org-${currentOrganization.id}-logo.${fileExt}`;
      const filePath = `organization-logos/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(filePath);

      const logoUrl = urlData.publicUrl;
      
      setFormData(prev => ({ ...prev, logoUrl }));
      toast.success('Logo uploaded successfully');
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Organization name is required');
      return false;
    }

    if (formData.email && !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.website && !formData.website.startsWith('http')) {
      setFormData(prev => ({
        ...prev,
        website: `https://${prev.website}`
      }));
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentOrganization || !validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Prepare settings data
      const settings: OrganizationSettings = {
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        website: formData.website.trim(),
        logo_url: formData.logoUrl.trim(),
      };

      // Update organization using the admin service
      const result = await adminService.updateOrganization(currentOrganization.id, {
        name: formData.name.trim(),
        settings: settings,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Refresh organization context
      await refreshOrganization();

      toast.success('Organization profile updated successfully!');
    } catch (err: any) {
      console.error('Organization update error:', err);
      setError(err.message || 'Failed to update organization profile');
      toast.error('Failed to update organization profile');
    } finally {
      setLoading(false);
    }
  };

  if (!currentOrganization) {
    return (
      <Card size="3">
        <Flex direction="column" align="center" justify="center" gap="4" style={{ minHeight: '200px' }}>
          <AlertCircle size={48} color="red" />
          <Text color="red">No organization data available</Text>
        </Flex>
      </Card>
    );
  }

  return (
    <Card size="3">
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="4">
          <Heading size="3">Root Organization Details</Heading>
          <Text size="2" color="gray">
            This information will be used across the system and may appear on reports, invoices, and customer-facing materials.
          </Text>

          {error && (
            <Flex gap="2" align="center" style={{ padding: '12px', backgroundColor: 'var(--red-2)', borderRadius: '6px' }}>
              <AlertCircle size={16} color="red" />
              <Text size="2" color="red">{error}</Text>
            </Flex>
          )}
          
          <Flex gap="4" direction="column">
            {/* Organization Logo */}
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Organization Logo</Text>
              <Flex align="center" gap="2" mb="4">
                <Avatar 
                  size="6" 
                  src={formData.logoUrl || undefined}
                  fallback={formData.name.substring(0, 2).toUpperCase() || 'OR'}
                />
                <Flex align="center" gap="2">
                  <label>
                    <Button 
                      size="1" 
                      variant="outline" 
                      disabled={uploading}
                      type="button"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload size={14} />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      }}
                    />
                  </label>
                  {formData.logoUrl && (
                    <Button 
                      size="1" 
                      variant="outline" 
                      color="red" 
                      type="button"
                      onClick={handleRemoveImage}
                    >
                      Remove
                    </Button>
                  )}
                </Flex>
              </Flex>
            </Flex>
            
            {/* Organization Name */}
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">
                Organization Name <Text color="red">*</Text>
              </Text>
              <TextField.Root
                placeholder="Enter organization name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Flex>
            
            {/* Business Address */}
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Business Address</Text>
              <TextField.Root
                placeholder="Enter business address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </Flex>
            
            {/* Phone Number */}
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Phone Number</Text>
              <TextField.Root
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                type="tel"
              />
            </Flex>
            
            {/* Email Address */}
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Email Address</Text>
              <TextField.Root
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                type="email"
              />
            </Flex>
            
            {/* Website URL */}
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">Website URL</Text>
              <TextField.Root
                placeholder="Enter website URL"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                type="url"
              />
            </Flex>
            
            {/* Submit Button */}
            <Flex>
              <Button 
                type="submit"
                color="green" 
                disabled={loading}
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </form>
    </Card>
  );
}
