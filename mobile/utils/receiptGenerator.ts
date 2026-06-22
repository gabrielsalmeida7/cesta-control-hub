import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { formatDateTimeBrasilia } from './dateFormat';
import type { Tables } from '@/integrations/supabase/types';

type StockMovement = Tables<'stock_movements'> & {
  product: { id: string; name: string; unit: string };
  supplier: { id: string; name: string } | null;
  institution: { id: string; name: string };
};

type Delivery = Tables<'deliveries'> & {
  family: {
    id: string;
    name: string;
    contact_person: string;
    cpf?: string | null;
    address?: string | null;
    phone?: string | null;
  } | null;
  institution: { id: string; name: string } | null;
};

interface ReceiptItem {
  product_name: string;
  quantity: number;
  unit: string;
}

const baseStyles = `
  body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; }
  h1 { color: #004E64; text-align: center; font-size: 18px; }
  h2 { text-align: center; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 12px; }
  th { background: #f3f4f6; }
  .meta { font-size: 12px; margin: 8px 0; }
  .signature { margin-top: 48px; border-top: 1px solid #000; padding-top: 8px; font-size: 11px; }
`;

async function printHtml(html: string, basename: string): Promise<string> {
  const safeName = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const destUri = `${FileSystem.cacheDirectory}${safeName}-${Date.now()}.pdf`;

  const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });

  if (base64) {
    await FileSystem.writeAsStringAsync(destUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else {
    await FileSystem.copyAsync({ from: uri, to: destUri });
  }

  const info = await FileSystem.getInfoAsync(destUri);
  if (!info.exists) {
    throw new Error('Falha ao salvar o PDF gerado.');
  }

  return destUri;
}

export async function generateStockMovementReceipt(
  movement: StockMovement,
  institutionName: string
): Promise<string> {
  const movementType = movement.movement_type === 'ENTRADA' ? 'ENTRADA' : 'SAÍDA';
  const formattedDate = formatDateTimeBrasilia(movement.movement_date);

  const html = `
    <html><head><style>${baseStyles}</style></head><body>
      <h1>RECIBO DE MOVIMENTAÇÃO DE ESTOQUE</h1>
      <h2>${movementType}</h2>
      <p class="meta"><strong>Instituição:</strong> ${institutionName}</p>
      <p class="meta"><strong>Data:</strong> ${formattedDate}</p>
      <table>
        <tr><th>Produto</th><th>Quantidade</th><th>Unidade</th></tr>
        <tr>
          <td>${movement.product.name}</td>
          <td>${movement.quantity}</td>
          <td>${movement.product.unit}</td>
        </tr>
      </table>
      ${movement.notes ? `<p class="meta"><strong>Observações:</strong> ${movement.notes}</p>` : ''}
      <div class="signature">Assinatura do Responsável</div>
    </body></html>
  `;

  return printHtml(html, 'recibo-movimentacao');
}

export async function generateDeliveryReceipt(
  delivery: Delivery,
  items: ReceiptItem[],
  institutionName: string,
  transactionId: string
): Promise<string> {
  const formattedDate = formatDateTimeBrasilia(delivery.delivery_date);
  const familyName = delivery.family?.name ?? 'N/A';
  const contactPerson = delivery.family?.contact_person ?? 'N/A';

  const rows = items
    .map(
      (item) =>
        `<tr><td>${item.product_name}</td><td>${item.quantity}</td><td>${item.unit}</td></tr>`
    )
    .join('');

  const html = `
    <html><head><style>${baseStyles}</style></head><body>
      <h1>RECIBO DE ENTREGA DE CESTA</h1>
      <p class="meta"><strong>Transação:</strong> ${transactionId}</p>
      <p class="meta"><strong>Instituição:</strong> ${institutionName}</p>
      <p class="meta"><strong>Data:</strong> ${formattedDate}</p>
      <p class="meta"><strong>Família:</strong> ${familyName}</p>
      <p class="meta"><strong>Responsável:</strong> ${contactPerson}</p>
      <table>
        <tr><th>Produto</th><th>Quantidade</th><th>Unidade</th></tr>
        ${rows}
      </table>
      ${delivery.notes ? `<p class="meta"><strong>Observações:</strong> ${delivery.notes}</p>` : ''}
      <div class="signature">Assinatura do Responsável</div>
    </body></html>
  `;

  return printHtml(html, 'recibo-entrega');
}
