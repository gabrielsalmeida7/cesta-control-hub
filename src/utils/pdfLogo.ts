import type jsPDF from 'jspdf';

const LOGO_SVG_PATH = '/CestaJustaLogo.svg';
const LOGO_ASPECT_RATIO = 1054 / 410;

export const loadLogoAsBase64 = async (): Promise<string | null> => {
  try {
    const response = await fetch(LOGO_SVG_PATH);
    if (!response.ok) return null;

    const svgText = await response.text();

    return new Promise((resolve) => {
      const img = new Image();
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const scale = 2;
          canvas.width = 1054 * scale;
          canvas.height = 410 * scale;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);
            resolve(base64);
          } else {
            URL.revokeObjectURL(url);
            resolve(null);
          }
        } catch (error) {
          console.warn('Erro ao converter SVG para canvas:', error);
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  } catch (error) {
    console.warn('Erro ao carregar logo SVG:', error);
    return null;
  }
};

export const addCestaJustaLogoToPdf = async (
  doc: jsPDF,
  yPosition: number,
  options?: { logoHeight?: number; spacingAfter?: number }
): Promise<number> => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoHeight = options?.logoHeight ?? 24;
  const spacingAfter = options?.spacingAfter ?? 8;
  const logoBase64 = await loadLogoAsBase64();

  if (!logoBase64) {
    return yPosition;
  }

  try {
    const logoWidth = logoHeight * LOGO_ASPECT_RATIO;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(logoBase64, 'PNG', logoX, yPosition, logoWidth, logoHeight);
    return yPosition + logoHeight + spacingAfter;
  } catch (error) {
    console.warn('Erro ao adicionar logo ao PDF:', error);
    return yPosition;
  }
};
