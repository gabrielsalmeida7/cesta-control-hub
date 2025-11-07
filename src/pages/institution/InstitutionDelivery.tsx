
import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import InstitutionNavigationButtons from '@/components/InstitutionNavigationButtons';
import { Search, Package, AlertTriangle, Plus, Minus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useInstitutionFamilies } from '@/hooks/useFamilies';
import { useCreateDelivery } from '@/hooks/useDeliveries';

interface DeliveryItem {
  item_name: string;
  quantity: number;
  unit: string;
}

interface Family {
  id: string;
  family_name: string;
  main_cpf: string;
  address: string;
  members_count: number;
  is_blocked: boolean;
  blocked_until?: string;
}

const InstitutionDelivery = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [blockingPeriod, setBlockingPeriod] = useState('30');
  const [notes, setNotes] = useState('');
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([
    { item_name: 'Cesta Básica', quantity: 1, unit: 'unidade' }
  ]);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { data: familiesData = [], isLoading: familiesLoading } = useInstitutionFamilies(profile?.institution_id);
  const createDelivery = useCreateDelivery();

  // Filter families to show only non-blocked ones
  const availableFamilies = useMemo(() => {
    return familiesData
      .filter((family: any) => !family.is_blocked || 
        (family.blocked_until && new Date(family.blocked_until) < new Date()))
      .map((family: any) => ({
        id: family.id,
        family_name: family.name || family.contact_person || 'N/A',
        main_cpf: '', // CPF não está no schema atual
        address: family.address || 'Não informado',
        members_count: family.members_count || 0,
        is_blocked: family.is_blocked || false,
        blocked_until: family.blocked_until || undefined
      }));
  }, [familiesData]);

  const filteredFamilies = useMemo(() => {
    return availableFamilies.filter(family =>
      family.family_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (family.main_cpf && family.main_cpf.includes(searchTerm))
    );
  }, [availableFamilies, searchTerm]);

  const addDeliveryItem = () => {
    setDeliveryItems([...deliveryItems, { item_name: '', quantity: 1, unit: 'unidade' }]);
  };

  const removeDeliveryItem = (index: number) => {
    if (deliveryItems.length > 1) {
      setDeliveryItems(deliveryItems.filter((_, i) => i !== index));
    }
  };

  const updateDeliveryItem = (index: number, field: keyof DeliveryItem, value: string | number) => {
    const updated = [...deliveryItems];
    updated[index] = { ...updated[index], [field]: value };
    setDeliveryItems(updated);
  };

  const handleDeliverySubmit = async () => {
    if (!selectedFamily) {
      toast({
        title: "Erro",
        description: "Selecione uma família para registrar a entrega.",
        variant: "destructive"
      });
      return;
    }

    if (!profile?.institution_id) {
      toast({
        title: "Erro",
        description: "Instituição não identificada. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se família está bloqueada
    if (selectedFamily.is_blocked && selectedFamily.blocked_until) {
      const blockedUntil = new Date(selectedFamily.blocked_until);
      if (blockedUntil > new Date()) {
        toast({
          title: "Erro",
          description: `Esta família está bloqueada até ${blockedUntil.toLocaleDateString('pt-BR')}.`,
          variant: "destructive"
        });
        return;
      }
    }

    if (deliveryItems.some(item => !item.item_name || item.quantity <= 0)) {
      toast({
        title: "Erro", 
        description: "Preencha todos os itens de entrega corretamente.",
        variant: "destructive"
      });
      return;
    }

    // Format delivery items for notes
    const itemsDescription = deliveryItems
      .map(item => `${item.item_name} (${item.quantity} ${item.unit})`)
      .join(', ');

    const deliveryNotes = notes 
      ? `${itemsDescription}. Observações: ${notes}`
      : itemsDescription;

    try {
      await createDelivery.mutateAsync({
        family_id: selectedFamily.id,
        institution_id: profile.institution_id,
        delivery_date: new Date().toISOString().split('T')[0],
        blocking_period_days: parseInt(blockingPeriod),
        notes: deliveryNotes
      });

      // Resetar formulário
      setSelectedFamily(null);
      setDeliveryItems([{ item_name: 'Cesta Básica', quantity: 1, unit: 'unidade' }]);
      setNotes('');
      setSearchTerm('');
    } catch (error) {
      // Error is already handled by the hook
      console.error('Error creating delivery:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <InstitutionNavigationButtons />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Registro de Entregas
            </h2>
            <p className="text-gray-600">
              Registre entregas de cestas básicas para famílias liberadas
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seleção de Família */}
            <Card>
              <CardHeader>
                <CardTitle>1. Selecionar Família</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar família por nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {familiesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : filteredFamilies.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      {searchTerm ? 'Nenhuma família encontrada' : 'Nenhuma família disponível para entrega'}
                    </p>
                  ) : (
                    filteredFamilies.map((family) => (
                      <div
                        key={family.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedFamily?.id === family.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedFamily(family)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{family.family_name}</p>
                            <p className="text-sm text-gray-500">{family.address}</p>
                          </div>
                          <Badge variant="default" className="bg-green-500">
                            Liberada
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {family.members_count} membros
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {selectedFamily && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Família Selecionada</h4>
                    <p className="text-sm"><strong>Nome:</strong> {selectedFamily.family_name}</p>
                    <p className="text-sm"><strong>Membros:</strong> {selectedFamily.members_count}</p>
                    <p className="text-sm"><strong>Endereço:</strong> {selectedFamily.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detalhes da Entrega */}
            <Card>
              <CardHeader>
                <CardTitle>2. Detalhes da Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Itens da Entrega */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Itens da Entrega</label>
                  <div className="space-y-2">
                    {deliveryItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder="Nome do item"
                          value={item.item_name}
                          onChange={(e) => updateDeliveryItem(index, 'item_name', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Qtd"
                          value={item.quantity}
                          onChange={(e) => updateDeliveryItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-20"
                          min="1"
                        />
                        <Select
                          value={item.unit}
                          onValueChange={(value) => updateDeliveryItem(index, 'unit', value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unidade">un</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="litros">L</SelectItem>
                            <SelectItem value="pacote">pct</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDeliveryItem(index)}
                          disabled={deliveryItems.length === 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addDeliveryItem}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Item
                    </Button>
                  </div>
                </div>

                {/* Período de Bloqueio */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Período de Bloqueio</label>
                  <Select value={blockingPeriod} onValueChange={setBlockingPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="15">15 dias</SelectItem>
                      <SelectItem value="20">20 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="45">45 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Observações */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Observações (opcional)</label>
                  <Textarea
                    placeholder="Informações adicionais sobre a entrega..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Aviso */}
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Atenção:</p>
                      <p>Após registrar a entrega, a família será automaticamente bloqueada pelo período selecionado.</p>
                    </div>
                  </div>
                </div>

                {/* Botão de Registrar */}
                <Button 
                  onClick={handleDeliverySubmit}
                  className="w-full"
                  disabled={!selectedFamily || createDelivery.isPending}
                >
                  {createDelivery.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Registrar Entrega
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstitutionDelivery;
