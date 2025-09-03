import { ScrollArea, Stack, Tabs } from '@mantine/core';
import useCollections from '../../lib/queries/useCollections';
import CollectionSelectorError from './Error.CollectionSelector';
import CollectionSelectorItem from '../collectionSelectorItem/CollectionSelectorItem';

interface Props {
  selectedCollections: { id: string; name: string; description?: string }[];
  onSelectedCollectionsChange: (
    collectionIds: { id: string; name: string; description?: string }[],
  ) => void;
}

export default function CollectionSelector(props: Props) {
  const { data, error } = useCollections();

  if (error) {
    return <CollectionSelectorError />;
  }

  return (
    <Stack>
      {/* <TextInput
        placeholder="Search for collections"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        size="sm"
        variant="filled"
        id="search"
        label="Collections"
      /> */}
      <Tabs defaultValue={'recent'}>
        <Tabs.List grow>
          <Tabs.Tab value="recent">Recent Collections</Tabs.Tab>
          <Tabs.Tab value="selected">
            Selected ({props.selectedCollections.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="recent" my={'xs'} w={'100%'}>
          <ScrollArea h={280}>
            <Stack gap={'xs'}>
              {data.collections.map((c) => (
                <CollectionSelectorItem
                  key={c.id}
                  name={c.name}
                  description={c.description}
                  value={c.id}
                  checked={
                    !!props.selectedCollections.find((col) => col.id === c.id)
                  }
                  onChange={(checked, item) => {
                    if (checked) {
                      // Add the item if it's not already selected
                      if (
                        !props.selectedCollections.some(
                          (col) => col.id === item.id,
                        )
                      ) {
                        props.onSelectedCollectionsChange([
                          ...props.selectedCollections,
                          item,
                        ]);
                      }
                    } else {
                      // Remove the item
                      props.onSelectedCollectionsChange(
                        props.selectedCollections.filter(
                          (col) => col.id !== item.id,
                        ),
                      );
                    }
                  }}
                />
              ))}
            </Stack>
          </ScrollArea>
        </Tabs.Panel>
        <Tabs.Panel value="selected" my="xs">
          <ScrollArea h={280}>
            <Stack gap="xs">
              {props.selectedCollections.map((c) => (
                <CollectionSelectorItem
                  key={c.id}
                  name={c.name}
                  description={c.description}
                  value={c.id}
                  checked={true}
                  onChange={(checked, item) => {
                    if (!checked) {
                      // Deselect the item
                      props.onSelectedCollectionsChange(
                        props.selectedCollections.filter(
                          (col) => col.id !== item.id,
                        ),
                      );
                    }
                    // If re-selecting in "selected" tab, do nothing
                  }}
                />
              ))}
            </Stack>
          </ScrollArea>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
