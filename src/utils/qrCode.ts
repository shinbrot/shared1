import QRCode from 'qrcode';

export const generateQRCode = async (url: string): Promise<string> => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: {
        dark: '#1f2937',
        light: '#ffffff'
      }
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};