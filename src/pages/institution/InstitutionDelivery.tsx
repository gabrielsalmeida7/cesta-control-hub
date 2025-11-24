
import React, { useState } from 'react';
import Header from '@/components/Header';
import InstitutionNavigationButtons from '@/components/InstitutionNavigationButtons';
import { Search, Package, AlertTriangle, Plus, Minus, Loader2, Warehouse, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useInstitutionFamilies } from '@/hooks/useFamilies';
import { useCreateDelivery } from '@/hooks/useInstitutionDeliveries';
import { useAuth } from '@/hooks/useAuth';
import { useInventory, useCreateStockMovement } from '@/hooks/useInventory';
import { useGenerateDeliveryReceipt } from '@/hooks/useReceipts';
import { getCurrentDateBrasilia } from '@/utils/dateFormat';
import FraudAlertDialog from '@/components/FraudAlertDialog';

interface DeliveryItem {
  item_name: string;
  quantity: number;
  unit: string;
  product_id?: string; // ID do produto do estoque (se selecionado do estoque)
}

const InstitutionDelivery = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [blockingPeriod, setBlockingPeriod] = useState('30');
  const [notes, setNotes] = useState('');
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
  const [showFraudAlert, setShowFraudAlert] = useState(false);
  const [blockingJustification, setBlockingJustification] = useState<string>('');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [isItemsListExpanded, setIsItemsListExpanded] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();
  
  const { data: families = [], isLoading } = useInstitutionFamilies(profile?.institution_id);
  const { data: inventory = [] } = useInventory(profile?.institution_id);
  const createDeliveryMutation = useCreateDelivery();
  const createStockMovement = useCreateStockMovement();
  const generateDeliveryReceipt = useGenerateDeliveryReceipt();

  // As famílias já vêm filtradas pela instituição do hook useInstitutionFamilies
  // Incluindo bloqueadas (podem ser entregues com justificativa)
  const availableFamilies = families || [];

  const filteredFamilies = availableFamilies.filter(family =>
    family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    family.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const removeDeliveryItem = (productId: string) => {
    setDeliveryItems(deliveryItems.filter(item => item.product_id !== productId));
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

    // Verificar se família está vinculada à instituição
    // useInstitutionFamilies já retorna apenas famílias vinculadas, mas validamos por segurança
    const familyData = availableFamilies.find((f: any) => f.id === selectedFamily.id);
    if (!familyData) {
      toast({
        title: "Erro",
        description: "Esta família não está vinculada à sua instituição. Por favor, vincule a família primeiro.",
        variant: "destructive"
      });
      return;
    }

    // Validar que pelo menos um item do estoque foi selecionado
    const stockItems = deliveryItems.filter(item => item.product_id);
    if (stockItems.length === 0) {
      toast({
        title: "Erro", 
        description: "Selecione pelo menos um item do estoque para realizar a entrega.",
        variant: "destructive"
      });
      return;
    }

    // Validar que todas as quantidades são válidas
    if (stockItems.some(item => item.quantity <= 0)) {
      toast({
        title: "Erro", 
        description: "Todas as quantidades devem ser maiores que zero.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se família está bloqueada - se sim, mostrar modal de fraude
    if (selectedFamily.is_blocked && selectedFamily.blocked_until) {
      const blockedUntil = new Date(selectedFamily.blocked_until);
      if (blockedUntil > new Date()) {
        // Família está bloqueada, mostrar modal de fraude
        setShowFraudAlert(true);
        return;
      }
    }

    // Se chegou aqui, família não está bloqueada ou bloqueio expirou - processar entrega
    processDelivery();
  };

  const processDelivery = async (justification?: string) => {
    if (!selectedFamily || !profile?.institution_id) return;

    try {
      // Apenas itens do estoque são permitidos
      const stockItems = deliveryItems.filter(item => item.product_id);
      
      if (stockItems.length === 0) {
        toast({
          title: "Erro",
          description: "Selecione pelo menos um item do estoque.",
          variant: "destructive"
        });
        return;
      }

      // Criar entrega
      const delivery = await createDeliveryMutation.mutateAsync({
        family_id: selectedFamily.id,
        blocking_period_days: parseInt(blockingPeriod),
        notes: notes && notes.trim() ? notes : undefined,
        blocking_justification: justification || undefined,
      });

      // Registrar saídas de estoque para todos os itens
      if (stockItems.length > 0 && profile?.institution_id) {
        try {
          for (const item of stockItems) {
            if (item.product_id) {
              await createStockMovement.mutateAsync({
                institution_id: profile.institution_id,
                product_id: item.product_id,
                movement_type: 'SAIDA',
                quantity: item.quantity,
                delivery_id: delivery.id,
                movement_date: getCurrentDateBrasilia(),
                notes: `Saída automática para entrega à família ${selectedFamily.name}`,
              });
            }
          }
        } catch (error: any) {
          console.error('Erro ao registrar saídas de estoque:', error);
          toast({
            title: "Aviso",
            description: "Entrega registrada, mas houve erro ao registrar saídas de estoque: " + (error.message || 'Erro desconhecido'),
            variant: "destructive"
          });
        }
      }

      // Gerar recibo automaticamente após entrega
      try {
        await generateDeliveryReceipt.mutateAsync(delivery.id);
      } catch (error: any) {
        console.error('Erro ao gerar recibo automaticamente:', error);
        // Não falhar a operação se apenas a geração do recibo falhar
        toast({
          title: "Aviso",
          description: "Entrega registrada, mas houve erro ao gerar recibo automaticamente. Você pode gerar manualmente depois.",
          variant: "default"
        });
      }

      toast({
        title: "Entrega Registrada",
        description: `Entrega registrada para ${selectedFamily.name}. Família bloqueada por ${blockingPeriod} dias. Recibo gerado automaticamente.`
      });

      // Resetar formulário
      setSelectedFamily(null);
      setDeliveryItems([]);
      setNotes('');
      setSearchTerm('');
      setBlockingJustification('');
      setShowFraudAlert(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar entrega. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleFraudAlertConfirm = (justification: string) => {
    setBlockingJustification(justification);
    setShowFraudAlert(false);
    processDelivery(justification);
  };

  const handleFraudAlertCancel = () => {
    setShowFraudAlert(false);
    setBlockingJustification('');
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

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredFamilies.map((family) => {
                      const isBlocked = family.is_blocked && family.blocked_until && new Date(family.blocked_until) > new Date();
                      return (
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
                              <p className="font-medium">{family.name}</p>
                              <p className="text-sm text-gray-600">{family.contact_person}</p>
                              <p className="text-sm text-gray-500">{family.phone || 'Sem telefone'}</p>
                            </div>
                            <Badge variant={isBlocked ? "destructive" : "default"} className={isBlocked ? "" : "bg-green-500"}>
                              {isBlocked ? "Bloqueada" : "Liberada"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {family.members_count || 'N/A'} membros
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {filteredFamilies.length === 0 && !isLoading && (
                  <p className="text-center text-gray-500 py-4">
                    {searchTerm 
                      ? "Nenhuma família encontrada com o termo de busca"
                      : "Nenhuma família cadastrada. Cadastre uma família primeiro na aba 'Famílias'."}
                  </p>
                )}

                {selectedFamily && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Família Selecionada</h4>
                    <p className="text-sm"><strong>Nome:</strong> {selectedFamily.name}</p>
                    <p className="text-sm"><strong>Contato:</strong> {selectedFamily.contact_person}</p>
                    <p className="text-sm"><strong>Membros:</strong> {selectedFamily.members_count || 'N/A'}</p>
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
                {/* Itens do Estoque */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium block flex items-center gap-2">
                      <Warehouse className="h-4 w-4" />
                      Selecionar Itens do Estoque
                      {deliveryItems.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {deliveryItems.length} {deliveryItems.length === 1 ? 'item selecionado' : 'itens selecionados'}
                        </Badge>
                      )}
                    </label>
                    {inventory.filter(item => item.quantity > 0).length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsItemsListExpanded(!isItemsListExpanded)}
                        className="h-8"
                      >
                        {isItemsListExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Mostrar ({inventory.filter(item => item.quantity > 0).length} itens)
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {inventory.filter(item => item.quantity > 0).length === 0 ? (
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center">
                      <p className="text-sm text-gray-500">
                        Nenhum item disponível no estoque
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Cadastre produtos e registre entradas de estoque na aba "Fornecedores"
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Campo de Busca */}
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Buscar produto..."
                          value={itemSearchTerm}
                          onChange={(e) => setItemSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Lista de Itens */}
                      {isItemsListExpanded && (
                        <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-3">
                          {inventory
                            .filter(item => {
                              if (item.quantity <= 0) return false;
                              if (!itemSearchTerm) return true;
                              const searchLower = itemSearchTerm.toLowerCase();
                              return item.product?.name?.toLowerCase().includes(searchLower);
                            })
                            .map((item) => {
                          const existingItem = deliveryItems.find(
                            di => di.product_id === item.product_id
                          );
                          const isSelected = !!existingItem;
                          
                          return (
                            <div
                              key={item.product_id}
                              className={`p-4 border rounded-lg transition-all ${
                                isSelected 
                                  ? 'border-primary bg-primary/5 shadow-sm' 
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-gray-900">{item.product?.name}</p>
                                    {isSelected && (
                                      <Badge variant="default" className="text-xs">
                                        Selecionado
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Disponível: <span className="font-medium">{item.quantity} {item.product?.unit}</span>
                                  </p>
                                </div>
                                {isSelected ? (
                                  <div className="flex gap-2 items-center flex-shrink-0">
                                    <div className="flex flex-col items-end gap-1">
                                      <label className="text-xs text-gray-500">Quantidade</label>
                                      <Input
                                        type="number"
                                        value={existingItem.quantity}
                                        onChange={(e) => {
                                          const qty = Math.max(1, Math.min(item.quantity, parseInt(e.target.value) || 1));
                                          const updated = deliveryItems.map(di => 
                                            di.product_id === item.product_id 
                                              ? { ...di, quantity: qty }
                                              : di
                                          );
                                          setDeliveryItems(updated);
                                        }}
                                        className="w-24"
                                        min="1"
                                        max={item.quantity}
                                      />
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeDeliveryItem(item.product_id)}
                                      className="mt-6"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setDeliveryItems([
                                        ...deliveryItems,
                                        {
                                          item_name: item.product?.name || '',
                                          quantity: 1,
                                          unit: item.product?.unit || 'unidade',
                                          product_id: item.product_id,
                                        }
                                      ]);
                                    }}
                                    className="flex-shrink-0"
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Adicionar
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      )}
                      {!isItemsListExpanded && (
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center">
                          <p className="text-sm text-gray-500">
                            {inventory.filter(item => item.quantity > 0).length} {inventory.filter(item => item.quantity > 0).length === 1 ? 'item disponível' : 'itens disponíveis'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Clique em "Mostrar" para ver e selecionar os itens
                          </p>
                        </div>
                      )}
                    </>
                  )}
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
                  disabled={!selectedFamily || createDeliveryMutation.isPending}
                >
                  {createDeliveryMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4 mr-2" />
                  )}
                  {createDeliveryMutation.isPending ? 'Registrando...' : 'Registrar Entrega'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal de Alerta de Fraude */}
      <FraudAlertDialog
        open={showFraudAlert}
        onOpenChange={setShowFraudAlert}
        onConfirm={handleFraudAlertConfirm}
        onCancel={handleFraudAlertCancel}
        familyName={selectedFamily?.name || ''}
        blockedByInstitutionName={(selectedFamily?.blocked_by_institution as any)?.name}
        blockedUntil={selectedFamily?.blocked_until}
        isLoading={createDeliveryMutation.isPending}
      />
    </div>
  );
};

export default InstitutionDelivery;
