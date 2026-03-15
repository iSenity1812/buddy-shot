import QRCode from "qrcode";
import { injectable } from "inversify";
import { IQrCodePort } from "../../application/ports/qrcode.port";

/**
 * QR code adapter using the `qrcode` npm package.
 */
@injectable()
export class QrCodeAdapter implements IQrCodePort {
  async generateBase64(data: string): Promise<string> {
    // Returns "data:image/png;base64,<...>" — we strip the prefix
    const dataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    // Strip "data:image/png;base64," prefix
    return dataUrl.replace(/^data:image\/png;base64,/, "");
  }
}
