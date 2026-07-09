
import React, { useState } from 'react';
import { Search, Package, AlertTriangle, Plus, Minus, Loader2, Warehouse, ChevronDown, ChevronUp, XCircle, CheckCircle, ChevronLeft } from 'lucide-react';
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
import { useOfflineAction } from '@/hooks/useOfflineAction';
import { useIsMobile } from '@/hooks/use-mobile';
import { InstitutionLayout } from '@/components/layout/InstitutionLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { MobileStickyFooter } from '@/components/layout/MobileStickyFooter';
import { DeliveryStepIndicator } from '@/components/institution/DeliveryStepIndicator';

interface DeliveryItem {
  item_name: string;
  quantity: number;
  unit: string;
  product_id?: string;
}

const InstitutionDelivery = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [blockingPeriod, setBlockingPeriod] = useState('30');
  const [customBlockingDays, setCustomBlockingDays] = useState('30');
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);

  const getBlockingPeriodDays = (): number | null => {
    if (blockingPeriod === 'custom') {
      const days = parseInt(customBlockingDays, 10);
      if (!Number.isInteger(days) || days <= 0) return null;
      return days;
    }
    const days = parseInt(blockingPeriod, 10);
    if (!Number.isInteger(days) || days <= 0) return null;
    return days;
  };
  const [notes, setNotes] = useState('');
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
  const [showFraudAlert, setShowFraudAlert] = useState(false);
  const [blockingJustification, setBlockingJustification] = useState<string>('');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [isItemsListExpanded, setIsItemsListExpanded] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { isOnline, guardOnline } = useOfflineAction();
  const isMobile = useIsMobile();
  
  const { data: families = [], isLoading } = useInstitutionFamilies(profile?.institution_id);
  const { data: inventory = [] } = useInventory(profile?.institution_id);
  const createDeliveryMutation = useCreateDelivery();
  const createStockMovement = useCreateStockMovement();
  const generateDeliveryReceipt = useGenerateDeliveryReceipt();

  const availableFamilies = families || [];

  const filteredFamilies = availableFamilies.filter(family =>
    family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    family.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (family.cpf && family.cpf.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, '')))
  );

  const stockItemsCount = deliveryItems.filter(item => item.product_id).length;

  const removeDeliveryItem = (productId: string) => {
    setDeliveryItems(deliveryItems.filter(item => item.product_id !== productId));
  };

  const incrementDeliveryItem = (productId: string, maxQuantity: number) => {
    setDeliveryItems(
      deliveryItems.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: Math.min(maxQuantity, item.quantity + 1) }
          : item,
      ),
    );
  };

  const decrementDeliveryItem = (productId: string) => {
    const existing = deliveryItems.find((item) => item.product_id === productId);
    if (!existing) {
      return;
    }
    if (existing.quantity <= 1) {
      removeDeliveryItem(productId);
      return;
    }
    setDeliveryItems(
      deliveryItems.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      ),
    );
  };

  const resetForm = () => {
    setSelectedFamily(null);
    setDeliveryItems([]);
    setNotes('');
    setSearchTerm('');
    setBlockingPeriod('30');
    setCustomBlockingDays('30');
    setBlockingJustification('');
    setShowFraudAlert(false);
    setMobileStep(1);
  };

  const handleDeliverySubmit = async () => {
    if (!guardOnline("O registro de entrega")) {
      return;
    }

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

    const familyData = availableFamilies.find((f: any) => f.id === selectedFamily.id);
    if (!familyData) {
      toast({
        title: "Erro",
        description: "Esta família não está vinculada à sua instituição. Por favor, vincule a família primeiro.",
        variant: "destructive"
      });
      return;
    }

    const stockItems = deliveryItems.filter(item => item.product_id);
    if (stockItems.length === 0) {
      toast({
        title: "Erro", 
        description: "Selecione pelo menos um item do estoque para realizar a entrega.",
        variant: "destructive"
      });
      return;
    }

    if (stockItems.some(item => item.quantity <= 0)) {
      toast({
        title: "Erro", 
        description: "Todas as quantidades devem ser maiores que zero.",
        variant: "destructive"
      });
      return;
    }

    const blockingDays = getBlockingPeriodDays();
    if (blockingDays === null) {
      toast({
        title: "Erro",
        description: "Informe um período de bloqueio válido (número inteiro maior que zero).",
        variant: "destructive"
      });
      return;
    }

    if (blockingDays > 999) {
      toast({
        title: "Erro",
        description: "O período de bloqueio não pode exceder 999 dias.",
        variant: "destructive"
      });
      return;
    }

    if (selectedFamily.is_blocked && selectedFamily.blocked_until) {
      const blockedUntil = new Date(selectedFamily.blocked_until);
      if (blockedUntil > new Date()) {
        setShowFraudAlert(true);
        return;
      }
    }

    processDelivery();
  };

  const processDelivery = async (justification?: string) => {
    if (!selectedFamily || !profile?.institution_id) return;

    try {
      const stockItems = deliveryItems.filter(item => item.product_id);
      
      if (stockItems.length === 0) {
        toast({
          title: "Erro",
          description: "Selecione pelo menos um item do estoque.",
          variant: "destructive"
        });
        return;
      }

      const blockingDays = getBlockingPeriodDays();
      if (blockingDays === null) {
        toast({
          title: "Erro",
          description: "Informe um período de bloqueio válido (número inteiro maior que zero).",
          variant: "destructive"
        });
        return;
      }

      const delivery = await createDeliveryMutation.mutateAsync({
        family_id: selectedFamily.id,
        blocking_period_days: blockingDays,
        notes: notes && notes.trim() ? notes : undefined,
        blocking_justification: justification || undefined,
      });

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

      if (!isMobile) {
        try {
          await generateDeliveryReceipt.mutateAsync(delivery.id);
        } catch (error: unknown) {
          console.error('Erro ao gerar recibo automaticamente:', error);
          toast({
            title: "Aviso",
            description: "Entrega registrada, mas houve erro ao gerar recibo automaticamente. Você pode gerar manualmente depois.",
            variant: "default"
          });
        }
      }

      toast({
        title: "Entrega Registrada",
        description: isMobile
          ? `Entrega registrada para ${selectedFamily.name}. Família bloqueada por ${blockingDays} dias.`
          : `Entrega registrada para ${selectedFamily.name}. Família bloqueada por ${blockingDays} dias. Recibo gerado automaticamente.`
      });

      resetForm();
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

  const renderFamilySelection = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar família por nome ou CPF..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          inputMode={/^\d[\d.\-/]*$/.test(searchTerm) ? 'numeric' : 'search'}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredFamilies.map((family) => {
            const isBlocked = family.is_blocked && family.blocked_until && new Date(family.blocked_until) > new Date();
            const daysRemaining = family.blocked_until
              ? Math.ceil(
                  (new Date(family.blocked_until).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : 0;
            return (
              <div
                key={family.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors touch-target ${
                  selectedFamily?.id === family.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedFamily(family)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{family.name}</p>
                    <p className="text-sm text-gray-600">{family.contact_person}</p>
                    <p className="text-sm text-gray-500">{family.phone || 'Sem telefone'}</p>
                  </div>
                  <Badge
                    variant={isBlocked ? 'destructive' : 'default'}
                    className={`flex items-center gap-1 shrink-0 ${isBlocked ? '' : 'bg-green-500'}`}
                  >
                    {isBlocked ? (
                      <>
                        <XCircle className="h-3 w-3" />
                        Bloqueada ({daysRemaining}d)
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Liberada
                      </>
                    )}
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
    </div>
  );

  const renderItemsSelection = () => (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium block flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            Selecionar Itens do Estoque
            {deliveryItems.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {deliveryItems.length} {deliveryItems.length === 1 ? 'item' : 'itens'}
              </Badge>
            )}
          </label>
          {inventory.filter(item => item.quantity > 0).length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsItemsListExpanded(!isItemsListExpanded)}
              className="h-8 touch-target"
            >
              {isItemsListExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Mostrar
                </>
              )}
            </Button>
          )}
        </div>
        
        {inventory.filter(item => item.quantity > 0).length === 0 ? (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center">
            <p className="text-sm text-gray-500">Nenhum item disponível no estoque</p>
            <p className="text-xs text-gray-400 mt-1">
              Cadastre produtos e registre entradas de estoque na aba &quot;Estoque&quot;
            </p>
          </div>
        ) : (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar produto..."
                value={itemSearchTerm}
                onChange={(e) => setItemSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
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
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
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
                            <div className="flex gap-2 items-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => decrementDeliveryItem(item.product_id)}
                                className="touch-target"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
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
                                className="w-20 text-center"
                                min="1"
                                max={item.quantity}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => incrementDeliveryItem(item.product_id, item.quantity)}
                                className="touch-target"
                                disabled={existingItem.quantity >= item.quantity}
                              >
                                <Plus className="h-4 w-4" />
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
                              className="touch-target w-full sm:w-auto"
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
          </>
        )}
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-4">
      {selectedFamily && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Família</h4>
          <p className="text-sm">{selectedFamily.name} — {selectedFamily.contact_person}</p>
        </div>
      )}

      {stockItemsCount > 0 && (
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">{stockItemsCount} item(ns) selecionado(s)</h4>
          <ul className="text-sm space-y-1">
            {deliveryItems.filter(i => i.product_id).map((item) => (
              <li key={item.product_id}>{item.item_name}: {item.quantity} {item.unit}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-2 block">Período de Bloqueio</label>
        <Select
          value={blockingPeriod}
          onValueChange={(value) => {
            setBlockingPeriod(value);
            if (value !== 'custom') {
              setCustomBlockingDays(value);
            }
          }}
        >
          <SelectTrigger className="touch-target">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="15">15 dias</SelectItem>
            <SelectItem value="20">20 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="45">45 dias</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
        {blockingPeriod === 'custom' && (
          <div className="mt-2">
            <Input
              type="number"
              min={1}
              max={999}
              placeholder="Informe o número de dias"
              value={customBlockingDays}
              onChange={(e) => setCustomBlockingDays(e.target.value)}
            />
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Observações (opcional)</label>
        <Textarea
          placeholder="Informações adicionais sobre a entrega..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Atenção:</p>
            <p>Após registrar a entrega, a família será automaticamente bloqueada pelo período selecionado.</p>
          </div>
        </div>
      </div>

      {!isMobile && (
        <Button 
          onClick={handleDeliverySubmit}
          className="w-full touch-target"
          disabled={!selectedFamily || createDeliveryMutation.isPending || !isOnline}
        >
          {createDeliveryMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Package className="h-4 w-4 mr-2" />
          )}
          {createDeliveryMutation.isPending ? 'Registrando...' : 'Registrar Entrega'}
        </Button>
      )}
    </div>
  );

  return (
    <InstitutionLayout title="Entregas">
      <PageHeader
        title="Registro de Entregas"
        description="Registre entregas de cestas básicas para famílias liberadas"
      />

      {isMobile && <DeliveryStepIndicator currentStep={mobileStep} />}

      {isMobile ? (
        <>
          <Card className={mobileStep === 3 ? 'mb-24' : 'mb-20'}>
            <CardHeader>
              <CardTitle>
                {mobileStep === 1 && '1. Selecionar Família'}
                {mobileStep === 2 && '2. Itens do Estoque'}
                {mobileStep === 3 && '3. Confirmar Entrega'}
              </CardTitle>
            </CardHeader>
            {mobileStep === 1 && <CardContent>{renderFamilySelection()}</CardContent>}
            {mobileStep === 2 && <CardContent>{renderItemsSelection()}</CardContent>}
            {mobileStep === 3 && <CardContent>{renderConfirmation()}</CardContent>}
          </Card>

          <MobileStickyFooter>
            {mobileStep === 1 && (
              <Button
                className="touch-target w-full bg-[#004E64] hover:bg-[#003648]"
                disabled={!selectedFamily}
                onClick={() => setMobileStep(2)}
              >
                Continuar
              </Button>
            )}
            {mobileStep === 2 && (
              <div className="flex gap-2">
                <Button variant="outline" className="touch-target flex-1" onClick={() => setMobileStep(1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  className="touch-target flex-1 bg-[#004E64] hover:bg-[#003648]"
                  disabled={stockItemsCount === 0}
                  onClick={() => setMobileStep(3)}
                >
                  Continuar
                </Button>
              </div>
            )}
            {mobileStep === 3 && (
              <div className="flex gap-2">
                <Button variant="outline" className="touch-target flex-1" onClick={() => setMobileStep(2)}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  className="touch-target flex-1 bg-[#004E64] hover:bg-[#003648]"
                  onClick={handleDeliverySubmit}
                  disabled={!selectedFamily || createDeliveryMutation.isPending || !isOnline}
                >
                  {createDeliveryMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4 mr-2" />
                  )}
                  {createDeliveryMutation.isPending ? 'Registrando...' : 'Registrar'}
                </Button>
              </div>
            )}
          </MobileStickyFooter>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Selecionar Família</CardTitle>
            </CardHeader>
            <CardContent>{renderFamilySelection()}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Detalhes da Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderItemsSelection()}
              {renderConfirmation()}
            </CardContent>
          </Card>
        </div>
      )}

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
    </InstitutionLayout>
  );
};

export default InstitutionDelivery;
