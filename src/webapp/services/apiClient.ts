import { createApiClient, createServerApiClient } from '@/api-client/ApiClient';

export const createServerSideSembleClient = () => {
  return createServerApiClient();
};

export const createClientSideSembleClient = () => {
  return createApiClient();
};

export const createSembleClient = () => {
  if (typeof window === 'undefined') {
    return createServerSideSembleClient();
  } else {
    return createClientSideSembleClient();
  }
};
