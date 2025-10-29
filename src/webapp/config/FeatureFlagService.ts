export interface FeatureFlags {
  similarCards: boolean;
}

export class FeatureFlagService {
  private flags: FeatureFlags;

  constructor() {
    this.flags = {
      similarCards: process.env.VERCEL_ENV !== 'production',
    };
  }

  public getFlags(): FeatureFlags {
    return this.flags;
  }

  public isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }
}
