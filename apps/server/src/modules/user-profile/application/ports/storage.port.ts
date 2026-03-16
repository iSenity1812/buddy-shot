/**
 * Port interface for the CDN / object-storage adapter.
 * Application layer calls this — infrastructure (R2/S3) implements it.
 */
export interface IStoragePort {
  /** Resolve a signed or public CDN URL from an R2 object key */
  getPublicUrl(key: string): string;

  /** Upload an object payload directly from server to storage */
  putObject(key: string, body: Buffer, contentType: string): Promise<void>;

  /** Generate a pre-signed upload URL for the client to PUT directly */
  getUploadPresignedUrl(
    key: string,
    expiresInSeconds?: number,
  ): Promise<string>;

  /** Delete an object from R2 */
  deleteObject(key: string): Promise<void>;
}
