import { Fragment } from 'react';
import SembleHeader from '../../components/SembleHeader/SembleHeader';

interface Props {
  url: string;
}

export default function SembleContaier(props: Props) {
  return (
    <Fragment>
      <SembleHeader url={props.url} />
      Semble container {props.url}
    </Fragment>
  );
}
