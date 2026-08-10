import jsPDF from 'jspdf';
import { formatDateBrasilia } from '@/utils/dateFormat';
import { extractDeliveryItems } from '@/utils/deliveryItems';
import { addCestaJustaLogoToPdf } from '@/utils/pdfLogo';

export interface FamilyItemsReportRow {
  familyName: string;
  contactPerson: string;
  deliveryDate: string;
  deliveryDateFormatted: string;
  itemName: string;
  quantity: number;
  unit: string;
}

export interface FamilyDeliveryGroup {
  deliveryDate: string;
  deliveryDateFormatted: string;
  items: { name: string; quantity: number; unit: string }[];
  subtotal: number;
}

export interface FamilyItemsGroup {
  familyName: string;
  contactPerson: string;
  deliveries: FamilyDeliveryGroup[];
  subtotal: number;
}

export interface FamilyItemsReport {
  families: FamilyItemsGroup[];
  rows: FamilyItemsReportRow[];
  totalItems: number;
  totalFamilies: number;
  totalDeliveries: number;
}

export type InstitutionDeliveryForReport = {
  id?: string;
  delivery_date: string;
  blocking_period_days?: number;
  notes?: string | null;
  stock_movements?: {
    status?: string;
    quantity: number;
    product?: { name?: string; unit?: string } | null;
  }[];
  family?: {
    id?: string;
    name?: string;
    contact_person?: string;
  } | null;
};

const escapeCsvValue = (value: string | number): string => {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

type AggregatedReportItem = {
  name: string;
  quantity: number;
  unit: string;
};

export const buildAggregatedItems = (
  rows: FamilyItemsReportRow[]
): AggregatedReportItem[] => {
  const aggregated = new Map<string, AggregatedReportItem>();

  for (const row of rows) {
    const key = `${row.itemName.trim().toLowerCase()}|${row.unit.trim().toLowerCase()}`;
    const existing = aggregated.get(key);

    if (existing) {
      existing.quantity += row.quantity;
      continue;
    }

    aggregated.set(key, {
      name: row.itemName.trim(),
      quantity: row.quantity,
      unit: row.unit.trim(),
    });
  }

  return Array.from(aggregated.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR')
  );
};

const pluralizeItemName = (name: string, quantity: number): string => {
  const normalized = name.trim().toLowerCase();
  if (quantity === 1) return normalized;
  if (normalized === 'cesta básica') return 'cestas básicas';

  return normalized;
};

const formatAggregatedItemPart = (item: AggregatedReportItem): string => {
  const label = pluralizeItemName(item.name, item.quantity);
  return `${item.quantity} ${label}`;
};

export const buildAggregatedItemsSummary = (
  rows: FamilyItemsReportRow[]
): string => {
  const parts = buildAggregatedItems(rows).map(formatAggregatedItemPart);

  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;

  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
};

export const buildFamilyItemsReport = (
  deliveries: InstitutionDeliveryForReport[]
): FamilyItemsReport => {
  const familyMap = new Map<
    string,
    {
      familyName: string;
      contactPerson: string;
      deliveries: FamilyDeliveryGroup[];
    }
  >();

  const rows: FamilyItemsReportRow[] = [];
  let totalItems = 0;
  const deliveryIds = new Set<string>();

  for (const delivery of deliveries) {
    const familyKey = delivery.family?.id || delivery.family?.name || 'unknown';
    const familyName = delivery.family?.name || 'N/A';
    const contactPerson = delivery.family?.contact_person || 'N/A';
    const deliveryDate = delivery.delivery_date;
    const deliveryDateFormatted = formatDateBrasilia(deliveryDate);
    const items = extractDeliveryItems(delivery);

    if (delivery.id) {
      deliveryIds.add(delivery.id);
    }

    if (!familyMap.has(familyKey)) {
      familyMap.set(familyKey, {
        familyName,
        contactPerson,
        deliveries: [],
      });
    }

    const familyEntry = familyMap.get(familyKey)!;
    const deliveryGroup: FamilyDeliveryGroup = {
      deliveryDate,
      deliveryDateFormatted,
      items: [],
      subtotal: 0,
    };

    for (const item of items) {
      deliveryGroup.items.push({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      });
      deliveryGroup.subtotal += item.quantity;
      totalItems += item.quantity;

      rows.push({
        familyName,
        contactPerson,
        deliveryDate,
        deliveryDateFormatted,
        itemName: item.name,
        quantity: item.quantity,
        unit: item.unit,
      });
    }

    familyEntry.deliveries.push(deliveryGroup);
  }

  const families: FamilyItemsGroup[] = Array.from(familyMap.values())
    .map((family) => {
      const deliveryGroups = family.deliveries.sort(
        (a, b) =>
          new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime()
      );

      return {
        familyName: family.familyName,
        contactPerson: family.contactPerson,
        deliveries: deliveryGroups,
        subtotal: deliveryGroups.reduce((sum, d) => sum + d.subtotal, 0),
      };
    })
    .sort((a, b) => a.familyName.localeCompare(b.familyName, 'pt-BR'));

  return {
    families,
    rows,
    totalItems,
    totalFamilies: families.length,
    totalDeliveries: deliveryIds.size || deliveries.length,
  };
};

export const exportFamilyItemsReportCSV = (
  report: FamilyItemsReport,
  filenamePrefix = 'relatorio_itens_por_familia'
): void => {
  const headers = ['Família', 'Contato', 'Data', 'Item', 'Quantidade', 'Unidade'];
  let csvContent = headers.join(',') + '\n';

  for (const row of report.rows) {
    csvContent +=
      [
        escapeCsvValue(row.familyName),
        escapeCsvValue(row.contactPerson),
        escapeCsvValue(row.deliveryDateFormatted),
        escapeCsvValue(row.itemName),
        escapeCsvValue(row.quantity),
        escapeCsvValue(row.unit),
      ].join(',') + '\n';
  }

  csvContent += '\n';
  csvContent += `TOTAL GERAL,,,,,${report.totalItems}\n`;

  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const dateSuffix = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `${filenamePrefix}_${dateSuffix}.csv`);
};

export const exportFamilyItemsReportPDF = async (
  report: FamilyItemsReport,
  options: {
    institutionName: string;
    periodLabel: string;
    familyLabel?: string;
    filenamePrefix?: string;
  }
): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  const ensureSpace = (needed: number) => {
    if (yPosition + needed > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  yPosition = await addCestaJustaLogoToPdf(doc, yPosition, {
    logoHeight: 24,
    spacingAfter: 10,
  });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE ITENS ENTREGUES POR FAMÍLIA', pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Instituição: ${options.institutionName}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Período: ${options.periodLabel}`, margin, yPosition);
  yPosition += 6;
  if (options.familyLabel) {
    doc.text(`Família: ${options.familyLabel}`, margin, yPosition);
    yPosition += 6;
  }
  doc.text(
    `Gerado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
    margin,
    yPosition
  );
  yPosition += 12;

  const tableWidth = pageWidth - margin * 2;
  const colWidths = [tableWidth * 0.55, tableWidth * 0.2, tableWidth * 0.25];

  const drawItemsTable = (
    items: { name: string; quantity: number; unit: string }[]
  ) => {
    ensureSpace(16);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.rect(margin, yPosition, colWidths[0], 8, 'S');
    doc.text('Produto', margin + 2, yPosition + 6);
    doc.rect(margin + colWidths[0], yPosition, colWidths[1], 8, 'S');
    doc.text('Quantidade', margin + colWidths[0] + 2, yPosition + 6);
    doc.rect(margin + colWidths[0] + colWidths[1], yPosition, colWidths[2], 8, 'S');
    doc.text('Unidade', margin + colWidths[0] + colWidths[1] + 2, yPosition + 6);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    for (const item of items) {
      ensureSpace(10);
      doc.rect(margin, yPosition, colWidths[0], 8, 'S');
      doc.text(item.name, margin + 2, yPosition + 6);
      doc.rect(margin + colWidths[0], yPosition, colWidths[1], 8, 'S');
      doc.text(String(item.quantity), margin + colWidths[0] + 2, yPosition + 6);
      doc.rect(margin + colWidths[0] + colWidths[1], yPosition, colWidths[2], 8, 'S');
      doc.text(item.unit, margin + colWidths[0] + colWidths[1] + 2, yPosition + 6);
      yPosition += 8;
    }
  };

  for (const family of report.families) {
    for (const delivery of family.deliveries) {
      ensureSpace(14);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Data: ${delivery.deliveryDateFormatted}`, margin, yPosition);
      yPosition += 6;

      drawItemsTable(delivery.items);
      yPosition += 8;
    }
  }

  const aggregatedItems = buildAggregatedItems(report.rows);

  ensureSpace(24);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo dos itens recebidos:', margin, yPosition);
  yPosition += 8;

  if (aggregatedItems.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Nenhum item registrado.', margin, yPosition);
    yPosition += 10;
  } else {
    drawItemsTable(aggregatedItems);
    yPosition += 4;
  }

  ensureSpace(12);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL GERAL DE ITENS: ${report.totalItems}`, margin, yPosition);

  const dateSuffix = new Date().toISOString().split('T')[0];
  const prefix = options.filenamePrefix || 'relatorio_itens_por_familia';
  doc.save(`${prefix}_${dateSuffix}.pdf`);
};

export const exportDeliveriesSummaryCSV = (
  deliveries: InstitutionDeliveryForReport[],
  filenamePrefix = 'relatorio_entregas'
): void => {
  const headers = [
    'Nome',
    'Data',
    'Contato',
    'Período Bloqueio',
    'Observações',
  ];
  let csvContent = headers.join(',') + '\n';

  for (const delivery of deliveries) {
    const observations =
      delivery.notes?.includes('__ITEMS_START__')
        ? delivery.notes.substring(
            delivery.notes.indexOf('__ITEMS_END__') + '__ITEMS_END__'.length
          ).trim()
        : delivery.notes || '';

    csvContent +=
      [
        escapeCsvValue(delivery.family?.name || ''),
        escapeCsvValue(formatDateBrasilia(delivery.delivery_date)),
        escapeCsvValue(delivery.family?.contact_person || ''),
        escapeCsvValue(
          delivery.blocking_period_days
            ? `${delivery.blocking_period_days} dias`
            : ''
        ),
        escapeCsvValue(observations),
      ].join(',') + '\n';
  }

  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const dateSuffix = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `${filenamePrefix}_${dateSuffix}.csv`);
};
