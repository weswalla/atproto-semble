import { Box, Tabs, TabsList, TabsPanel } from '@mantine/core';
import SembleNotesContainer from '../../containers/sembleNotesContainer/SembleNotesContainer';
import SembleNotesContainerSkeleton from '../../containers/sembleNotesContainer/Skeleton.SembleNotesContainer';
import SembleCollectionsContainerSkeleton from '../../containers/sembleCollectionsContainer/Skeleton.SembleCollectionsContainer';
import SembleCollectionsContainer from '../../containers/sembleCollectionsContainer/SembleCollectionsContainer';
import SembleLibrariesContainerSkeleton from '../../containers/sembleLibrariesContainer/Skeleton.SembleLibrariesContainer';
import SembleLibrariesContainer from '../../containers/sembleLibrariesContainer/SembleLibrariesContainer';
import TabItem from './TabItem';
import { Suspense } from 'react';

interface Props {
  url: string;
}

export default function SembleTabs(props: Props) {
  return (
    <Tabs defaultValue={'notes'}>
      <TabsList>
        <TabItem value="notes">Notes</TabItem>
        <TabItem value="collections">Collections</TabItem>
        <TabItem value="addedBy">Added by</TabItem>
      </TabsList>

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
      </Box>
    </Tabs>
  );
}
