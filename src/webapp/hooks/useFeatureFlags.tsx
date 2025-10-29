'use client';

import { createContext, useContext } from 'react';
import { FeatureFlagService, FeatureFlags } from '../config/FeatureFlagService';

const featureFlagService = new FeatureFlagService();
const FeatureFlagContext = createContext<FeatureFlags>(featureFlagService.getFlags());

export function useFeatureFlags(): FeatureFlags {
  return useContext(FeatureFlagContext);
}
