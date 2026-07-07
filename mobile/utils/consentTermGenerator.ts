import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { formatCpf } from './documentFormat';

export interface ConsentTermData {
  familyName: string;
  familyCpf?: string;
  contactPerson: string;
  phone?: string;
  address?: string;
  institutionName: string;
  termId: string;
  generatedAt: string;
}

export function generateTermId(): string {
  return `TC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function generateConsentTermPDF(data: ConsentTermData): Promise<string> {
  const cpf = data.familyCpf ? formatCpf(data.familyCpf) : 'Não informado';

  const html = `
    <html><head><style>
      body { font-family: Helvetica, Arial, sans-serif; padding: 32px; color: #0f172a; font-size: 12px; line-height: 1.6; }
      h1 { color: #004E64; text-align: center; font-size: 16px; }
      h2 { font-size: 13px; margin-top: 20px; }
      .meta { margin: 12px 0; }
    </style></head><body>
      <h1>TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS PESSOAIS</h1>
      <p class="meta"><strong>Termo ID:</strong> ${data.termId}</p>
      <p class="meta"><strong>Gerado em:</strong> ${data.generatedAt}</p>
      <p class="meta"><strong>Instituição:</strong> ${data.institutionName}</p>
      <h2>Dados do Titular</h2>
      <p><strong>Família:</strong> ${data.familyName}</p>
      <p><strong>Responsável:</strong> ${data.contactPerson}</p>
      <p><strong>CPF:</strong> ${cpf}</p>
      ${data.phone ? `<p><strong>Telefone:</strong> ${data.phone}</p>` : ''}
      ${data.address ? `<p><strong>Endereço:</strong> ${data.address}</p>` : ''}
      <h2>Consentimento</h2>
      <p>Autorizo o tratamento dos meus dados pessoais para fins de cadastro e acompanhamento
      no Sistema de Controle de Alimentos, conforme a Lei nº 13.709/2018 (LGPD).</p>
      <p style="margin-top: 48px;">__________________________________________</p>
      <p>Assinatura do Titular ou Responsável Legal</p>
    </body></html>
  `;

  const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
  const destUri = `${FileSystem.cacheDirectory}termo-consentimento-${Date.now()}.pdf`;

  if (base64) {
    await FileSystem.writeAsStringAsync(destUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else {
    await FileSystem.copyAsync({ from: uri, to: destUri });
  }

  return destUri;
}
