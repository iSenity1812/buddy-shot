export interface QrCodeResponseOutputDto {
  userId: string;
  username: string;
  /** Base64-encoded PNG of the QR code */
  qrCodeBase64: string;
}
