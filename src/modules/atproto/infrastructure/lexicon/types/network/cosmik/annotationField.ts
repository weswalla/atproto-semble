/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../lexicons'
import { type $Typed, is$typed as _is$typed, type OmitKey } from '../../../util'

const is$typed = _is$typed,
  validate = _validate
const id = 'network.cosmik.annotationField'

export interface Record {
  $type: 'network.cosmik.annotationField'
  /** Name of the annotation field */
  name: string
  /** Description of the annotation field */
  description: string
  /** Timestamp when this field was created */
  createdAt?: string
  definition:
    | $Typed<DyadFieldDef>
    | $Typed<TriadFieldDef>
    | $Typed<RatingFieldDef>
    | $Typed<SingleSelectFieldDef>
    | $Typed<MultiSelectFieldDef>
    | { $type: string }
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}

/** Definition structure for a dyad field. */
export interface DyadFieldDef {
  $type?: 'network.cosmik.annotationField#dyadFieldDef'
  /** Label for side A of the dyad */
  sideA: string
  /** Label for side B of the dyad */
  sideB: string
}

const hashDyadFieldDef = 'dyadFieldDef'

export function isDyadFieldDef<V>(v: V) {
  return is$typed(v, id, hashDyadFieldDef)
}

export function validateDyadFieldDef<V>(v: V) {
  return validate<DyadFieldDef & V>(v, id, hashDyadFieldDef)
}

/** Definition structure for a triad field. */
export interface TriadFieldDef {
  $type?: 'network.cosmik.annotationField#triadFieldDef'
  /** Label for vertex A of the triad */
  vertexA: string
  /** Label for vertex B of the triad */
  vertexB: string
  /** Label for vertex C of the triad */
  vertexC: string
}

const hashTriadFieldDef = 'triadFieldDef'

export function isTriadFieldDef<V>(v: V) {
  return is$typed(v, id, hashTriadFieldDef)
}

export function validateTriadFieldDef<V>(v: V) {
  return validate<TriadFieldDef & V>(v, id, hashTriadFieldDef)
}

/** Definition structure for a rating field. */
export interface RatingFieldDef {
  $type?: 'network.cosmik.annotationField#ratingFieldDef'
  /** Maximum number of stars for the rating */
  numberOfStars: 5
}

const hashRatingFieldDef = 'ratingFieldDef'

export function isRatingFieldDef<V>(v: V) {
  return is$typed(v, id, hashRatingFieldDef)
}

export function validateRatingFieldDef<V>(v: V) {
  return validate<RatingFieldDef & V>(v, id, hashRatingFieldDef)
}

/** Definition structure for a single-select field. */
export interface SingleSelectFieldDef {
  $type?: 'network.cosmik.annotationField#singleSelectFieldDef'
  /** Available options for selection */
  options: string[]
}

const hashSingleSelectFieldDef = 'singleSelectFieldDef'

export function isSingleSelectFieldDef<V>(v: V) {
  return is$typed(v, id, hashSingleSelectFieldDef)
}

export function validateSingleSelectFieldDef<V>(v: V) {
  return validate<SingleSelectFieldDef & V>(v, id, hashSingleSelectFieldDef)
}

/** Definition structure for a multi-select field. */
export interface MultiSelectFieldDef {
  $type?: 'network.cosmik.annotationField#multiSelectFieldDef'
  /** Available options for selection */
  options: string[]
}

const hashMultiSelectFieldDef = 'multiSelectFieldDef'

export function isMultiSelectFieldDef<V>(v: V) {
  return is$typed(v, id, hashMultiSelectFieldDef)
}

export function validateMultiSelectFieldDef<V>(v: V) {
  return validate<MultiSelectFieldDef & V>(v, id, hashMultiSelectFieldDef)
}
