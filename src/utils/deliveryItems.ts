export interface DeliveryItem {
  name: string;
  quantity: number;
  unit: string;
  cancelled?: boolean;
}

export interface ParsedDeliveryNotes {
  items: DeliveryItem[];
  observations: string | null;
}

export type DeliveryMovementItem = {
  status?: string;
  quantity: number;
  product?: { name?: string; unit?: string } | null;
  cancellation_reason?: string | null;
};

export type DeliveryWithItems = {
  notes?: string | null;
  stock_movements?: DeliveryMovementItem[];
};

export const parseDeliveryNotes = (
  notes: string | null | undefined
): ParsedDeliveryNotes => {
  if (!notes) return { items: [], observations: null };

  const itemsStartIndex = notes.indexOf('__ITEMS_START__');
  const itemsEndIndex = notes.indexOf('__ITEMS_END__');

  if (itemsStartIndex !== -1 && itemsEndIndex !== -1) {
    const itemsSection = notes
      .substring(itemsStartIndex + '__ITEMS_START__'.length, itemsEndIndex)
      .trim();

    const items = itemsSection
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const [name, quantity, unit] = line.split('|');
        return {
          name: name?.trim() || '',
          quantity: parseInt(quantity?.trim() || '1', 10),
          unit: unit?.trim() || 'unidade',
        };
      })
      .filter((item) => item.name);

    const observations = notes
      .substring(itemsEndIndex + '__ITEMS_END__'.length)
      .trim();

    return {
      items,
      observations: observations || null,
    };
  }

  return {
    items: [],
    observations: notes,
  };
};

export const extractDeliveryItems = (
  delivery: DeliveryWithItems,
  options?: { includeCancelled?: boolean }
): DeliveryItem[] => {
  const includeCancelled = options?.includeCancelled ?? false;
  const movements = delivery.stock_movements || [];

  if (movements.length > 0) {
    return movements
      .filter((movement) => includeCancelled || movement.status !== 'CANCELLED')
      .map((movement) => ({
        name: movement.product?.name || 'Produto',
        quantity: movement.quantity,
        unit: movement.product?.unit || 'unidade',
        cancelled: movement.status === 'CANCELLED',
      }));
  }

  const { items: additionalItems } = parseDeliveryNotes(delivery.notes);
  const legacyItems: DeliveryItem[] = [
    { name: 'Cesta Básica', quantity: 1, unit: 'unidade' },
    ...additionalItems,
  ];

  return legacyItems;
};

export const countDeliveryItems = (delivery: DeliveryWithItems): number =>
  extractDeliveryItems(delivery).reduce((total, item) => total + item.quantity, 0);
