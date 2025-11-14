import Header from "@/components/Header";
import NavigationButtons from "@/components/NavigationButtons";
import { FileText, Download, Calendar, AlertTriangle, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { useAlerts, useFamiliesWithMultipleInstitutions } from "@/hooks/useAlerts";
import { useReportExport } from "@/hooks/useReportExport";

const Reports = () => {
  const { data: alerts = [], isLoading: alertsLoading } = useAlerts();
  const { data: familiesWithMultiple = [], isLoading: familiesLoading } = useFamiliesWithMultipleInstitutions();
  const { 
    exportDeliveriesReport, 
    exportFamiliesReport, 
    exportInstitutionsReport, 
    exportSummaryReport 
  } = useReportExport();
  
  const reportTypes = [
    { 
      id: 1, 
      title: "Entregas por Período", 
      description: "Relatório detalhado de todas as entregas em um período específico", 
      icon: Calendar,
      action: () => exportDeliveriesReport()
    },
    { 
      id: 2, 
      title: "Famílias Cadastradas", 
      description: "Lista completa de famílias cadastradas com status e informações", 
      icon: FileText,
      action: () => exportFamiliesReport()
    },
    { 
      id: 3, 
      title: "Instituições Cadastradas", 
      description: "Lista de todas as instituições cadastradas no sistema", 
      icon: FileText,
      action: () => exportInstitutionsReport()
    },
    { 
      id: 4, 
      title: "Resumo Estatístico", 
      description: "Resumo geral com totais e estatísticas do sistema", 
      icon: FileText,
      action: () => exportSummaryReport()
    },
  ];

  // State for alert filter and date filters
  const [alertFilter, setAlertFilter] = useState('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [alertsToShow, setAlertsToShow] = useState(10);
  const [alertsPerPage, setAlertsPerPage] = useState(10);
  const [familiesToShow, setFamiliesToShow] = useState(10);
  const [familiesPerPage, setFamiliesPerPage] = useState(10);

  // Filter alerts based on selected type
  const filteredAlerts = useMemo(() => {
    const filtered = alertFilter === 'todos' 
      ? alerts 
      : alerts.filter(alert => alert.type === alertFilter);
    return filtered;
  }, [alerts, alertFilter]);

  // Alerts to display (paginated)
  const displayedAlerts = useMemo(() => {
    return filteredAlerts.slice(0, alertsToShow);
  }, [filteredAlerts, alertsToShow]);

  const hasMoreAlerts = filteredAlerts.length > alertsToShow;

  // Get alert count by severity
  const highSeverityCount = alerts.filter(alert => alert.severity === 'alta').length;
  const mediumSeverityCount = alerts.filter(alert => alert.severity === 'média').length;
  const lowSeverityCount = alerts.filter(alert => alert.severity === 'baixa').length;

  // Function to get badge color based on severity
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'alta': return "bg-destructive text-destructive-foreground hover:bg-destructive/80";
      case 'média': return "bg-orange-500 text-white hover:bg-orange-600";
      case 'baixa': return "bg-blue-500 text-white hover:bg-blue-600";
      default: return "";
    }
  };

  // Function to get icon based on alert type
  const getAlertIcon = (type) => {
    switch (type) {
      case 'fraude': 
      case 'duplicado': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'expirado': return <BellRing className="h-5 w-5 text-orange-500" />;
      default: return <BellRing className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header />
      <NavigationButtons />
      
      <main className="pt-20 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto">
        {/* Alerts Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Painel de Alertas</h2>
          <p className="text-gray-600 mb-6">
            Monitore possíveis tentativas de fraude, solicitações duplicadas e outros alertas do sistema
          </p>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <Button 
              variant={alertFilter === 'todos' ? "default" : "outline"}
              onClick={() => setAlertFilter('todos')}
              className="flex items-center gap-2"
            >
              Todos <Badge>{alerts.length}</Badge>
            </Button>
            <Button 
              variant={alertFilter === 'fraude' ? "default" : "outline"}
              onClick={() => setAlertFilter('fraude')}
              className="flex items-center gap-2"
            >
              Fraudes <AlertTriangle className="h-4 w-4" />
            </Button>
            <Button 
              variant={alertFilter === 'duplicado' ? "default" : "outline"}
              onClick={() => setAlertFilter('duplicado')}
              className="flex items-center gap-2"
            >
              Duplicados
            </Button>
            <Button 
              variant={alertFilter === 'expirado' ? "default" : "outline"}
              onClick={() => setAlertFilter('expirado')}
              className="flex items-center gap-2"
            >
              Expirados <BellRing className="h-4 w-4" />
            </Button>
            
            {/* Seletor de quantidade por página */}
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-gray-600 whitespace-nowrap">Mostrar:</label>
              <Select 
                value={alertsPerPage.toString()} 
                onValueChange={(value) => {
                  const newValue = parseInt(value);
                  setAlertsPerPage(newValue);
                  setAlertsToShow(newValue);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600 whitespace-nowrap">por página</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-red-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Alta Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{highSeverityCount}</div>
                <p className="text-sm text-gray-500">Alertas que precisam de atenção imediata</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Média Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-500">{mediumSeverityCount}</div>
                <p className="text-sm text-gray-500">Alertas que precisam ser verificados</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Baixa Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">{lowSeverityCount}</div>
                <p className="text-sm text-gray-500">Alertas informativos</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            {alertsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <Skeleton className="h-5 w-5 rounded" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedAlerts.length > 0 ? (
              <>
                {displayedAlerts.map(alert => (
                <Alert key={alert.id} className="border-l-4 relative" style={{ borderLeftColor: alert.severity === 'alta' ? '#dc2626' : alert.severity === 'média' ? '#f97316' : '#3b82f6' }}>
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <AlertTitle className="text-base flex items-center gap-2">
                          {alert.title}
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                          </Badge>
                        </AlertTitle>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <AlertDescription className="text-sm">
                        {alert.description}
                      </AlertDescription>
                      <div className="flex justify-end mt-2">
                        <Button variant="outline" size="sm">Resolver</Button>
                        <Button variant="ghost" size="sm" className="ml-2">Ver Detalhes</Button>
                      </div>
                    </div>
                  </div>
                </Alert>
                ))}
                
                {/* Botão para mostrar mais/menos alertas */}
                {filteredAlerts.length > alertsPerPage && (
                  <div className="flex justify-center pt-4">
                    {hasMoreAlerts ? (
                      <Button
                        variant="outline"
                        onClick={() => setAlertsToShow(prev => prev + alertsPerPage)}
                      >
                        Ver mais ({filteredAlerts.length - alertsToShow} restantes)
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setAlertsToShow(alertsPerPage)}
                      >
                        Ver menos
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum alerta encontrado para o filtro selecionado
              </div>
            )}
          </div>
        </div>

        {/* Alert: Famílias em Múltiplas Instituições */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Famílias em Múltiplas Instituições</h2>
              <p className="text-gray-600">
                Lista de famílias que estão cadastradas em mais de uma instituição
              </p>
            </div>
            
            {/* Seletor de quantidade por página para famílias */}
            {familiesWithMultiple.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Mostrar:</label>
                <Select 
                  value={familiesPerPage.toString()} 
                  onValueChange={(value) => {
                    const newValue = parseInt(value);
                    setFamiliesPerPage(newValue);
                    setFamiliesToShow(newValue);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600 whitespace-nowrap">por página</span>
              </div>
            )}
          </div>
          
          {familiesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : familiesWithMultiple.length > 0 ? (
            <div className="space-y-4">
              {familiesWithMultiple.slice(0, familiesToShow).map((family) => (
                <Alert key={family.id} className="border-l-4" style={{ borderLeftColor: '#f97316' }}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="flex items-center gap-2">
                    {family.name}
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      {family.institutions.length} instituições
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <div className="space-y-2">
                      <p><strong>Contato:</strong> {family.contact_person}</p>
                      {family.cpf && (
                        <p><strong>CPF:</strong> {family.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                      )}
                      <div>
                        <strong>Instituições vinculadas:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {family.institutions.map((inst) => (
                            <li key={inst.id}>{inst.name}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
              
              {/* Botão para mostrar mais/menos famílias */}
              {familiesWithMultiple.length > familiesPerPage && (
                <div className="flex justify-center pt-4">
                  {familiesToShow < familiesWithMultiple.length ? (
                    <Button
                      variant="outline"
                      onClick={() => setFamiliesToShow(prev => prev + familiesPerPage)}
                    >
                      Ver mais ({familiesWithMultiple.length - familiesToShow} restantes)
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setFamiliesToShow(familiesPerPage)}
                    >
                      Ver menos
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  Nenhuma família cadastrada em múltiplas instituições encontrada
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Standard Reports Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Gerar Relatórios</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportTypes.map((report) => {
              const IconComponent = report.icon;
              return (
                <Card key={report.id}>
                  <CardHeader className="flex flex-row items-start space-y-0 pb-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                    </div>
                    <IconComponent className="h-5 w-5 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                     <div className="space-y-4">
                      {report.id === 1 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Data Inicial</label>
                            <Input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Data Final</label>
                            <Input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              onClick={() => exportDeliveriesReport(startDate, endDate)}
                              className="w-full"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Exportar CSV
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={report.action}
                          className="w-full"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Exportar CSV
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
