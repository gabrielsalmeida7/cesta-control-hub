
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, MapPin } from "lucide-react";
import FamilyHeatmap from "./FamilyHeatmap";

// Mock data para famílias em Araguari-MG
const allFamiliesData = [
  { id: 1, name: "Família Silva", members: 4, lat: -18.6322, lng: -48.1938, status: "ativa" },
  { id: 2, name: "Família Oliveira", members: 3, lat: -18.6456, lng: -48.1877, status: "ativa" },
  { id: 3, name: "Família Santos", members: 5, lat: -18.6289, lng: -48.2012, status: "pendente" },
  { id: 4, name: "Família Costa", members: 2, lat: -18.6350, lng: -48.1970, status: "ativa" },
  { id: 5, name: "Família Pereira", members: 6, lat: -18.6410, lng: -48.1850, status: "bloqueada" },
  { id: 6, name: "Família Souza", members: 4, lat: -18.6380, lng: -48.1890, status: "ativa" },
  { id: 7, name: "Família Lima", members: 3, lat: -18.6320, lng: -48.1920, status: "ativa" },
  { id: 8, name: "Família Ferreira", members: 5, lat: -18.6260, lng: -48.2000, status: "pendente" },
];

const HeatmapReport = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Filtramos as famílias com base no status selecionado
  const filteredFamilies = statusFilter === "all" 
    ? allFamiliesData 
    : allFamiliesData.filter(family => {
        if (statusFilter === "active") return family.status === "ativa";
        if (statusFilter === "pending") return family.status === "pendente";
        if (statusFilter === "blocked") return family.status === "bloqueada";
        return true;
      });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-lg">Densidade Populacional por Região</CardTitle>
        </div>
        <MapPin className="h-5 w-5 text-gray-500" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">Visualização da distribuição de famílias atendidas em Araguari-MG</p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Select 
              defaultValue="all" 
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status da Família" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="blocked">Bloqueadas</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Exportar Dados
            </Button>
          </div>
          
          <div className="h-96 rounded-md border">
            <FamilyHeatmap families={filteredFamilies} />
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Estatísticas:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>Total de famílias mapeadas: {filteredFamilies.length}</li>
              <li>Famílias ativas: {filteredFamilies.filter(f => f.status === "ativa").length}</li>
              <li>Famílias pendentes: {filteredFamilies.filter(f => f.status === "pendente").length}</li>
              <li>Famílias bloqueadas: {filteredFamilies.filter(f => f.status === "bloqueada").length}</li>
              <li>Média de membros por família: {filteredFamilies.length > 0 ? 
                (filteredFamilies.reduce((acc, curr) => acc + curr.members, 0) / filteredFamilies.length).toFixed(1) : 
                "0"}
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatmapReport;
