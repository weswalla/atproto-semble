/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../lexicons'
import { type $Typed, is$typed as _is$typed, type OmitKey } from '../../../util'
import type * as AppAnnosDefs from './defs.js'
import type * as ComAtprotoRepoStrongRef from '../../com/atproto/repo/strongRef.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'app.annos.annotation'

export interface Record {
  $type: 'app.annos.annotation'
  /** The primary URL identifying the annotated resource. */
  url: string
  /** Optional additional identifiers for the resource. */
  additionalIdentifiers?: AppAnnosDefs.Identifier[]
  field: ComAtprotoRepoStrongRef.Main
  fromTemplates?: ComAtprotoRepoStrongRef.Main[]
  /** An optional user-provided note about the annotation. */
  note?: string
  value:
    | $Typed<DyadValue>
    | $Typed<TriadValue>
    | $Typed<RatingValue>
    | $Typed<SingleSelectValue>
    | $Typed<MultiSelectValue>
    | { $type: string }
  /** Timestamp when this annotation was created (usually set by PDS). */
  createdAt?: string
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}

/** Value structure for a dyad annotation. */
export interface DyadValue {
  $type?: 'app.annos.annotation#dyadValue'
  /** Value representing the relationship between sides */
  value: number
}

const hashDyadValue = 'dyadValue'

export function isDyadValue<V>(v: V) {
  return is$typed(v, id, hashDyadValue)
}

export function validateDyadValue<V>(v: V) {
  return validate<DyadValue & V>(v, id, hashDyadValue)
}

/** Value structure for a triad annotation. */
export interface TriadValue {
  $type?: 'app.annos.annotation#triadValue'
  /** Value for vertex A */
  vertexA: number
  /** Value for vertex B */
  vertexB: number
  /** Value for vertex C */
  vertexC: number
  /** Sum of the values for the vertices */
  sum?: 1000
}

const hashTriadValue = 'triadValue'

export function isTriadValue<V>(v: V) {
  return is$typed(v, id, hashTriadValue)
}

export function validateTriadValue<V>(v: V) {
  return validate<TriadValue & V>(v, id, hashTriadValue)
}

/** Value structure for a rating annotation. */
export interface RatingValue {
  $type?: 'app.annos.annotation#ratingValue'
  /** The star rating value */
  rating: number
}

const hashRatingValue = 'ratingValue'

export function isRatingValue<V>(v: V) {
  return is$typed(v, id, hashRatingValue)
}

export function validateRatingValue<V>(v: V) {
  return validate<RatingValue & V>(v, id, hashRatingValue)
}

/** Value structure for a single-select annotation. */
export interface SingleSelectValue {
  $type?: 'app.annos.annotation#singleSelectValue'
  /** The selected option */
  option: string
}

const hashSingleSelectValue = 'singleSelectValue'

export function isSingleSelectValue<V>(v: V) {
  return is$typed(v, id, hashSingleSelectValue)
}

export function validateSingleSelectValue<V>(v: V) {
  return validate<SingleSelectValue & V>(v, id, hashSingleSelectValue)
}

/** Value structure for a multi-select annotation. */
export interface MultiSelectValue {
  $type?: 'app.annos.annotation#multiSelectValue'
  /** The selected options */
  option: string[]
}

const hashMultiSelectValue = 'multiSelectValue'

export function isMultiSelectValue<V>(v: V) {
  return is$typed(v, id, hashMultiSelectValue)
}

export function validateMultiSelectValue<V>(v: V) {
  return validate<MultiSelectValue & V>(v, id, hashMultiSelectValue)
}
