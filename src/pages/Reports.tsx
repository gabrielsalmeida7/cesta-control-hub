
import Header from "@/components/Header";
import { FileText, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Reports = () => {
  // Mock data
  const username = "Gabriel Admin";
  const reportTypes = [
    { id: 1, title: "Entregas por Período", description: "Relatório detalhado de todas as entregas em um período específico", icon: Calendar },
    { id: 2, title: "Famílias Atendidas por Instituição", description: "Análise das famílias atendidas por cada instituição cadastrada", icon: FileText },
    { id: 3, title: "Resumo Mensal de Entregas", description: "Totais e médias de cestas entregues por mês", icon: FileText },
    { id: 4, title: "Instituições por Desempenho", description: "Ranking de instituições por número de entregas realizadas", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header username={username} />
      
      <main className="pt-20 pb-8 px-4 md:px-8 max-w-[1400px] mx-auto">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="last-month">Último Mês</SelectItem>
                            <SelectItem value="last-3-months">Últimos 3 Meses</SelectItem>
                            <SelectItem value="last-6-months">Últimos 6 Meses</SelectItem>
                            <SelectItem value="last-year">Último Ano</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button>
                          <Download className="mr-2 h-4 w-4" />
                          Gerar PDF
                        </Button>
                      </div>
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
