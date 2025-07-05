export interface PublishedRecordDTO {
  id: string;
  uri: string;
  cid: string;
  recordedAt: Date;
}

export interface PublishedRecordRefDTO {
  publishedRecordId?: string | null;
  publishedRecord?: PublishedRecordDTO;
}
