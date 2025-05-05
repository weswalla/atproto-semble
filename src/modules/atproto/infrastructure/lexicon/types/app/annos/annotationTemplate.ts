/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../lexicons'
import { type $Typed, is$typed as _is$typed, type OmitKey } from '../../../util'
import type * as ComAtprotoRepoStrongRef from '../../com/atproto/repo/strongRef.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'app.annos.annotationTemplate'

export interface Record {
  $type: 'app.annos.annotationTemplate'
  /** Name of the template */
  name: string
  /** Description of the template */
  description: string
  /** List of strong references to app.annos.annotationField records included in this template. */
  annotationFields: AnnotationFieldRef[]
  /** Timestamp when this template was created */
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

/** A reference to an annotation field. Defines if the field is required in the template. */
export interface AnnotationFieldRef {
  $type?: 'app.annos.annotationTemplate#annotationFieldRef'
  subject: ComAtprotoRepoStrongRef.Main
  required?: boolean
}

const hashAnnotationFieldRef = 'annotationFieldRef'

export function isAnnotationFieldRef<V>(v: V) {
  return is$typed(v, id, hashAnnotationFieldRef)
}

export function validateAnnotationFieldRef<V>(v: V) {
  return validate<AnnotationFieldRef & V>(v, id, hashAnnotationFieldRef)
}
