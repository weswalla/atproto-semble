// Database representation of a published record
export interface PublishedRecordDTO {
  id: string;
  uri: string;
  cid: string;
  recordedAt?: Date;
}

// Database representation of a reference to a published record
export interface PublishedRecordRefDTO {
  publishedRecordId: string | null; // Database foreign key reference
  publishedRecord?: PublishedRecordDTO; // The actual record data when joined
}
