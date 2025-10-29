import { createSembleClient } from '@/services/apiClient';
import { cache } from 'react';

interface PageParams {
  page?: number;
  limit?: number;
}

interface SearchParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  searchText?: string;
}

export const getCollectionsForUrl = cache(
  async (url: string, params?: PageParams) => {
    const client = createSembleClient();
    const response = await client.getCollectionsForUrl({
      url,
      page: params?.page,
      limit: params?.limit,
    });

    return response;
  },
);

export const getCollections = cache(
  async (didOrHandle: string, params?: PageParams) => {
    const client = createSembleClient();
    const response = await client.getCollections({
      identifier: didOrHandle,
      limit: params?.limit,
      page: params?.page,
    });

    return response;
  },
);

export const getMyCollections = cache(
  async (params?: PageParams & SearchParams) => {
    // await verifySession();

    const client = createSembleClient();
    const response = await client.getMyCollections({
      page: params?.page,
      limit: params?.limit,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      searchText: params?.searchText,
    });

    return response;
  },
);

export const createCollection = cache(
  async (newCollection: { name: string; description: string }) => {
    // await verifySession();
    const client = createSembleClient();
    const response = await client.createCollection(newCollection);

    return response;
  },
);

export const deleteCollection = cache(async (id: string) => {
  // await verifySession();
  const client = createSembleClient();
  const response = await client.deleteCollection({ collectionId: id });

  return response;
});

export const updateCollection = cache(
  async (collection: {
    collectionId: string;
    rkey: string;
    name: string;
    description?: string;
  }) => {
    // await verifySession();
    const client = createSembleClient();
    const response = await client.updateCollection(collection);

    return response;
  },
);

export const getCollectionPageByAtUri = cache(
  async ({
    recordKey,
    handle,
    params,
  }: {
    recordKey: string;
    handle: string;
    params?: PageParams;
  }) => {
    const client = createSembleClient();
    const response = await client.getCollectionPageByAtUri({
      recordKey,
      handle,
      page: params?.page,
      limit: params?.limit,
    });

    return response;
  },
);
