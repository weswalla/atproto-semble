export interface ICuratorEnrichmentService {
  enrichCurators(curatorIds: string[]): Promise<Map<string, CuratorInfo>>;
}

export interface CuratorInfo {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
}
