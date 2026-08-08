// Neutral types shared by the client sync layer and the server OAuth/Drive code.
// No client- or server-only imports here, so both sides can use it safely.

export interface SyncUser {
  email: string;
  name: string;
  picture: string;
}

export interface DriveFileMeta {
  id: string;
  modifiedTime: string; // RFC 3339, Drive's server clock
}
