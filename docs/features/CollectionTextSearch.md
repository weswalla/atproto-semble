- want to be able to perform text search over a users collections so that they can quickly and easily add a card to existing collections.
- will this be part of the `GetMyCollectionsUseCase` with added query params (text field) or do we treat it separately as `SearchMyCollectionsUseCase`?
- we currently have the following API method and types:

```typescript
  async getMyCollections(
    params?: GetMyCollectionsParams,
  ): Promise<GetMyCollectionsResponse> {
    return this.queryClient.getMyCollections(params);
  }

export interface GetMyCollectionsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetCollectionPageResponse {
  id: string;
  name: string;
  description?: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string;
  };
  urlCards: CollectionPageUrlCard[];
  pagination: Pagination;
  sorting: Sorting;
}
```

- will it make more sense to have something like .searchMyCollections(searchString: string)
- what are my options?
