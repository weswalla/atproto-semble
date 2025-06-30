import { Result } from "src/shared/core/Result";

export interface ICuratorEnrichmentService {
  enrichCurators(curatorIds: string[]): Promise<Result<Map<string, CuratorInfo>>>;
}

export interface CuratorInfo {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
}
