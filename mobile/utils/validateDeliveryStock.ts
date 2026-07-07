interface DeliveryItemInput {
  product_id?: string;
  item_name: string;
  quantity: number;
  unit: string;
}

interface InventoryRowInput {
  product_id: string;
  quantity: number;
  product?: { id: string; unit: string };
}

export function validateDeliveryStock(
  items: DeliveryItemInput[],
  inventory: InventoryRowInput[]
): string | null {
  const stockItems = items.filter((item) => item.product_id);

  if (stockItems.length === 0) {
    return 'Selecione pelo menos um item do estoque para realizar a entrega.';
  }

  if (stockItems.some((item) => item.quantity <= 0)) {
    return 'Todas as quantidades devem ser maiores que zero.';
  }

  for (const item of stockItems) {
    const inv = inventory.find(
      (row) => row.product_id === item.product_id || row.product?.id === item.product_id
    );
    const available = inv?.quantity ?? 0;

    if (item.quantity > available) {
      return `Estoque insuficiente para "${item.item_name}". Disponível: ${available} ${item.unit}.`;
    }
  }

  return null;
}

export function getMaxQuantityForProduct(
  productId: string,
  inventory: InventoryRowInput[]
): number {
  const inv = inventory.find(
    (row) => row.product_id === productId || row.product?.id === productId
  );
  return inv?.quantity ?? 0;
}
