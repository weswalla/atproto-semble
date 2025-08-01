import { BaseClient } from './BaseClient';
import { GetGlobalFeedParams, GetGlobalFeedResponse } from '../types';

export class FeedClient extends BaseClient {
  async getGlobalFeed(
    params?: GetGlobalFeedParams,
  ): Promise<GetGlobalFeedResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.beforeActivityId)
      searchParams.set('beforeActivityId', params.beforeActivityId);

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/api/feeds/global?${queryString}`
      : '/api/feeds/global';

    return this.request<GetGlobalFeedResponse>('GET', endpoint);
  }
}
