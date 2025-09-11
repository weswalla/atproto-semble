import React, { Fragment } from 'react';
import CollectionSelectorItem from '../collectionSelectorItem/CollectionSelectorItem';

interface Collection {
  id: string;
  name: string;
  cardCount: number;
}

interface Props {
  collections: Collection[];
  selectedCollections: Collection[];
  onChange: (checked: boolean, item: Collection) => void;
}

export default function CollectionSelectorItemList(props: Props) {
  return (
    <Fragment>
      {props.collections.map((c) => (
        <CollectionSelectorItem
          key={c.id}
          name={c.name}
          cardCount={c.cardCount}
          value={c.id}
          checked={!!props.selectedCollections.find((col) => col.id === c.id)}
          onChange={(checked) => props.onChange(checked, c)}
        />
      ))}
    </Fragment>
  );
}
