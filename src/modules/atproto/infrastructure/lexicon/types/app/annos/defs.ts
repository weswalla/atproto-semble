/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from "@atproto/lexicon";
import { CID } from "multiformats/cid";
import { validate as _validate } from "../../../lexicons";
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from "../../../util";

const is$typed = _is$typed,
  validate = _validate;
const id = "network.cosmik.defs";

/** Represents an identifier with a type and value. */
export interface Identifier {
  $type?: "network.cosmik.defs#identifier";
  /** The type of identifier (e.g., 'doi', 'at-uri', 'isbn'). */
  type: string;
  /** The identifier value. */
  value: string;
}

const hashIdentifier = "identifier";

export function isIdentifier<V>(v: V) {
  return is$typed(v, id, hashIdentifier);
}

export function validateIdentifier<V>(v: V) {
  return validate<Identifier & V>(v, id, hashIdentifier);
}
