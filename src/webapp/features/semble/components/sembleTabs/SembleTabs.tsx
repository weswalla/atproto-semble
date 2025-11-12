import {
  Box,
  Group,
  ScrollAreaAutosize,
  Tabs,
  TabsList,
  TabsPanel,
} from '@mantine/core';
import SembleNotesContainer from '../../containers/sembleNotesContainer/SembleNotesContainer';
import SembleNotesContainerSkeleton from '../../containers/sembleNotesContainer/Skeleton.SembleNotesContainer';
import SembleCollectionsContainerSkeleton from '../../containers/sembleCollectionsContainer/Skeleton.SembleCollectionsContainer';
import SembleCollectionsContainer from '../../containers/sembleCollectionsContainer/SembleCollectionsContainer';
import SembleLibrariesContainerSkeleton from '../../containers/sembleLibrariesContainer/Skeleton.SembleLibrariesContainer';
import SembleLibrariesContainer from '../../containers/sembleLibrariesContainer/SembleLibrariesContainer';
import SembleSimilarCardsContainerSkeleton from '../../containers/sembleSimilarCardsContainer/Skeleton.SembleSimilarCardsContainer';
import SembleSimilarCardsContainer from '../../containers/sembleSimilarCardsContainer/SembleSimilarCardsContainer';
import TabItem from './TabItem';
import { Suspense } from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface Props {
  url: string;
}

export default function SembleTabs(props: Props) {
  const featureFlags = useFeatureFlags();

  return (
    <Tabs defaultValue={'notes'}>
      <ScrollAreaAutosize type="scroll">
        <TabsList>
          <Group wrap="nowrap">
            <TabItem value="notes">Notes</TabItem>
            <TabItem value="collections">Collections</TabItem>
            <TabItem value="addedBy">Added by</TabItem>
            {featureFlags.similarCards && (
              <TabItem value="similar">Similar Cards</TabItem>
            )}
          </Group>
        </TabsList>
      </ScrollAreaAutosize>

      <Box mt={'md'}>
        <TabsPanel value="notes">
          <Suspense fallback={<SembleNotesContainerSkeleton />}>
            <SembleNotesContainer url={props.url} />
          </Suspense>
        </TabsPanel>
        <TabsPanel value="collections">
          <Suspense fallback={<SembleCollectionsContainerSkeleton />}>
            <SembleCollectionsContainer url={props.url} />
          </Suspense>
        </TabsPanel>
        <TabsPanel value="addedBy">
          <Suspense fallback={<SembleLibrariesContainerSkeleton />}>
            <SembleLibrariesContainer url={props.url} />
          </Suspense>
        </TabsPanel>
        {featureFlags.similarCards && (
          <TabsPanel value="similar">
            <Suspense fallback={<SembleSimilarCardsContainerSkeleton />}>
              <SembleSimilarCardsContainer url={props.url} />
            </Suspense>
          </TabsPanel>
        )}
      </Box>
    </Tabs>
  );
}
