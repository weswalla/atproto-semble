import { ok, err, Result } from '../../../../shared/core/Result';

export enum Visibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export function parseVisibility(value: string): Result<Visibility, Error> {
  if (value === Visibility.PUBLIC || value === Visibility.PRIVATE) {
    return ok(value as Visibility);
  }
  return err(new Error(`Invalid visibility: ${value}`));
}
