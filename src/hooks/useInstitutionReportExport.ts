import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  buildFamilyItemsReport,
  exportDeliveriesSummaryCSV,
  exportFamilyItemsReportCSV,
  exportFamilyItemsReportPDF,
  type InstitutionDeliveryForReport,
} from '@/utils/familyItemsReportGenerator';

export const useInstitutionReportExport = () => {
  const { toast } = useToast();

  const validateDeliveries = useCallback(
    (deliveries: InstitutionDeliveryForReport[]): boolean => {
      if (deliveries.length === 0) {
        toast({
          title: 'Nenhuma entrega encontrada',
          description:
            'Não há entregas para exportar no período ou filtro selecionado.',
          variant: 'destructive',
        });
        return false;
      }
      return true;
    },
    [toast]
  );

  const exportDeliveriesSummary = useCallback(
    (deliveries: InstitutionDeliveryForReport[]) => {
      if (!validateDeliveries(deliveries)) return;

      try {
        exportDeliveriesSummaryCSV(deliveries);
        toast({
          title: 'Relatório exportado',
          description: 'Arquivo CSV de entregas baixado com sucesso.',
        });
      } catch (error) {
        console.error('Error exporting deliveries summary:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao exportar relatório. Tente novamente.',
          variant: 'destructive',
        });
      }
    },
    [toast, validateDeliveries]
  );

  const exportFamilyItemsByDateCSV = useCallback(
    (
      deliveries: InstitutionDeliveryForReport[],
      options?: { filenamePrefix?: string }
    ) => {
      if (!validateDeliveries(deliveries)) return;

      try {
        const report = buildFamilyItemsReport(deliveries);
        exportFamilyItemsReportCSV(
          report,
          options?.filenamePrefix || 'relatorio_itens_por_familia'
        );
        toast({
          title: 'Relatório exportado',
          description: 'Arquivo CSV de itens por família baixado com sucesso.',
        });
      } catch (error) {
        console.error('Error exporting family items CSV:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao exportar relatório. Tente novamente.',
          variant: 'destructive',
        });
      }
    },
    [toast, validateDeliveries]
  );

  const exportFamilyItemsByDatePDF = useCallback(
    async (
      deliveries: InstitutionDeliveryForReport[],
      options: {
        institutionName: string;
        periodLabel: string;
        familyLabel?: string;
        filenamePrefix?: string;
      }
    ) => {
      if (!validateDeliveries(deliveries)) return;

      try {
        const report = buildFamilyItemsReport(deliveries);
        await exportFamilyItemsReportPDF(report, options);
        toast({
          title: 'Relatório exportado',
          description: 'Arquivo PDF de itens por família baixado com sucesso.',
        });
      } catch (error) {
        console.error('Error exporting family items PDF:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao exportar relatório. Tente novamente.',
          variant: 'destructive',
        });
      }
    },
    [toast, validateDeliveries]
  );

  return {
    exportDeliveriesSummary,
    exportFamilyItemsByDateCSV,
    exportFamilyItemsByDatePDF,
  };
};
