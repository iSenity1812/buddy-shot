/**
 * Port interface for QR code generation.
 * Keeps the qrcode library out of the domain/application layers.
 */
export interface IQrCodePort {
  /** Returns Base64-encoded PNG */
  generateBase64(data: string): Promise<string>;
}
