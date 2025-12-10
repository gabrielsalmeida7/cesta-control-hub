import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReportData {
  families: any[];
  deliveries: any[];
  institutions: any[];
  stats: {
    totalFamilies: number;
    totalDeliveries: number;
    totalInstitutions: number;
    blockedFamilies: number;
  };
}

export const useReportExport = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const generateReport = useCallback(async (
    type: 'deliveries' | 'families' | 'institutions' | 'summary',
    startDate?: string,
    endDate?: string
  ): Promise<ReportData | null> => {
    if (!profile) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return null;
    }

    try {
      console.log('📊 Generating report:', { type, startDate, endDate, userRole: profile.role });

      let whereClause = '';
      const params: any[] = [];

      // Filtros de data se fornecidos
      if (startDate && endDate) {
        whereClause = 'WHERE delivery_date BETWEEN $1 AND $2';
        params.push(startDate, endDate);
      } else if (startDate) {
        whereClause = 'WHERE delivery_date >= $1';
        params.push(startDate);
      } else if (endDate) {
        whereClause = 'WHERE delivery_date <= $1';
        params.push(endDate);
      }

      // Buscar dados base sempre
      const [familiesResult, institutionsResult] = await Promise.all([
        supabase.from('families').select(`
          *,
          deliveries(
            id,
            delivery_date,
            blocking_period_days,
            notes,
            institution:institutions(name)
          )
        `),
        supabase.from('institutions').select('*')
      ]);

      if (familiesResult.error) throw familiesResult.error;
      if (institutionsResult.error) throw institutionsResult.error;

      const families = familiesResult.data || [];
      const institutions = institutionsResult.data || [];

      // Buscar entregas com filtros se necessário
      let deliveriesQuery = supabase
        .from('deliveries')
        .select(`
          *,
          family:families(name, contact_person, members_count),
          institution:institutions(name, address, phone)
        `)
        .order('delivery_date', { ascending: false });

      if (startDate) deliveriesQuery = deliveriesQuery.gte('delivery_date', startDate);
      if (endDate) deliveriesQuery = deliveriesQuery.lte('delivery_date', endDate);

      const deliveriesResult = await deliveriesQuery;
      if (deliveriesResult.error) throw deliveriesResult.error;

      const deliveries = deliveriesResult.data || [];

      // Calcular estatísticas
      const stats = {
        totalFamilies: families.length,
        totalDeliveries: deliveries.length,
        totalInstitutions: institutions.length,
        blockedFamilies: families.filter(f => f.is_blocked).length
      };

      const reportData: ReportData = {
        families,
        deliveries,
        institutions,
        stats
      };

      console.log('✅ Report data generated:', {
        families: families.length,
        deliveries: deliveries.length,
        institutions: institutions.length,
        stats
      });

      return reportData;
    } catch (error) {
      console.error('❌ Error generating report:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive"
      });
      return null;
    }
  }, [profile, toast]);

  const exportToCSV = useCallback((data: any[], filename: string, headers: string[]) => {
    try {
      // Criar header CSV
      let csvContent = headers.join(',') + '\n';

      // Adicionar dados
      data.forEach(row => {
        const values = headers.map(header => {
          const key = header.toLowerCase().replace(/ /g, '_');
          let value = '';
          
          // Mapear valores baseado no header
          switch (header) {
            case 'Nome':
              value = row.name || row.family?.name || '';
              break;
            case 'Data':
              value = row.delivery_date ? new Date(row.delivery_date).toLocaleDateString('pt-BR') : '';
              break;
            case 'Instituição':
              value = row.institution?.name || '';
              break;
            case 'Contato':
              value = row.contact_person || row.family?.contact_person || '';
              break;
            case 'Membros':
              value = row.members_count || row.family?.members_count || '';
              break;
            case 'Status':
              value = row.is_blocked ? 'Bloqueada' : 'Ativa';
              break;
            case 'Telefone':
              value = row.phone || row.institution?.phone || '';
              break;
            case 'Endereço':
              value = row.address || row.institution?.address || '';
              break;
            case 'Período Bloqueio':
              value = row.blocking_period_days ? `${row.blocking_period_days} dias` : '';
              break;
            case 'Observações':
              value = row.notes || '';
              break;
            default:
              value = row[key] || '';
          }
          
          // Escapar vírgulas e aspas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        });
        
        csvContent += values.join(',') + '\n';
      });

      // Adicionar BOM UTF-8 para compatibilidade com Excel
      csvContent = '\uFEFF' + csvContent;

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Relatório Exportado",
        description: `Arquivo ${filename}.csv baixado com sucesso.`
      });
    } catch (error) {
      console.error('❌ Error exporting CSV:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const exportDeliveriesReport = useCallback(async (startDate?: string, endDate?: string) => {
    const data = await generateReport('deliveries', startDate, endDate);
    if (data) {
      exportToCSV(
        data.deliveries,
        'relatorio_entregas',
        ['Nome', 'Data', 'Instituição', 'Contato', 'Período Bloqueio', 'Observações']
      );
    }
  }, [generateReport, exportToCSV]);

  const exportFamiliesReport = useCallback(async () => {
    const data = await generateReport('families');
    if (data) {
      exportToCSV(
        data.families,
        'relatorio_familias',
        ['Nome', 'Contato', 'Membros', 'Status', 'Telefone']
      );
    }
  }, [generateReport, exportToCSV]);

  const exportInstitutionsReport = useCallback(async () => {
    const data = await generateReport('institutions');
    if (data) {
      exportToCSV(
        data.institutions,
        'relatorio_instituicoes',
        ['Nome', 'Endereço', 'Telefone']
      );
    }
  }, [generateReport, exportToCSV]);

  const exportSummaryReport = useCallback(async (startDate?: string, endDate?: string) => {
    const data = await generateReport('summary', startDate, endDate);
    if (data) {
      // Criar resumo estatístico
      const summaryData = [
        { categoria: 'Total de Famílias', valor: data.stats.totalFamilies },
        { categoria: 'Total de Entregas', valor: data.stats.totalDeliveries },
        { categoria: 'Total de Instituições', valor: data.stats.totalInstitutions },
        { categoria: 'Famílias Bloqueadas', valor: data.stats.blockedFamilies },
        { categoria: 'Famílias Ativas', valor: data.stats.totalFamilies - data.stats.blockedFamilies }
      ];

      exportToCSV(
        summaryData,
        'relatorio_resumo',
        ['Categoria', 'Valor']
      );
    }
  }, [generateReport, exportToCSV]);

  return {
    generateReport,
    exportToCSV,
    exportDeliveriesReport,
    exportFamiliesReport,
    exportInstitutionsReport,
    exportSummaryReport
  };
};