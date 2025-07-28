import { useState, useEffect, useMemo } from 'react';
import { useExtensionAuth } from '../../hooks/useExtensionAuth';
import { ApiClient } from '../../api-client/ApiClient';
import { IoMdCheckmark } from 'react-icons/io';
import {
  Alert,
  Box,
  Button,
  Divider,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { UrlCardForm } from '../UrlCardForm';

export function SaveCardPage() {
  const { logout, accessToken } = useExtensionAuth();
  const [currentUrl, setCurrentUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const apiClient = useMemo(
    () =>
      new ApiClient(
        process.env.PLASMO_PUBLIC_API_URL || 'http://localhost:3000',
        () => accessToken,
      ),
    [accessToken],
  );

  // Get current tab URL when popup opens
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log('Tab info:', tabs[0]); // Debug log

        if (tabs[0]) {
          const tab = tabs[0];

          if (tab.url) {
            setCurrentUrl(tab.url);
          } else {
            console.error('No URL found in tab:', tab);
            setError(
              "Cannot access this page's URL. Make sure the extension has proper permissions.",
            );
          }
        } else {
          console.error('No active tab found');
          setError('No active tab found');
        }
      });
    } else {
      console.error('Chrome tabs API not available');
      setError('Extension API not available');
    }
  }, []);

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      window.close(); // Close the popup after successful save
    }, 1500);
  };

  if (success) {
    return (
      <Stack align="center" gap="xs" c="green">
        <IoMdCheckmark size={20} />
        <Text fw={500} c="gray">
          Card saved successfully!
        </Text>
      </Stack>
    );
  }

  return (
    <Box>
      <Stack>
        <Group justify="space-between">
          <Title order={1} fz="xl">
            Save Card
          </Title>
          <Button variant="subtle" color="gray" onClick={logout}>
            Sign out
          </Button>
        </Group>

        <Divider />

        {/* Error Display */}
        {error && <Alert color="red" title={error} />}

        {currentUrl ? (
          <UrlCardForm
            apiClient={apiClient}
            onSuccess={handleSuccess}
            onCancel={() => window.close()}
            initialUrl={currentUrl}
            showUrlInput={false}
            submitButtonText="Save Card"
            showCollections={true}
          />
        ) : (
          <Text c="gray" ta="center" py="md">
            Loading current page...
          </Text>
        )}
      </Stack>
    </Box>
  );
}
