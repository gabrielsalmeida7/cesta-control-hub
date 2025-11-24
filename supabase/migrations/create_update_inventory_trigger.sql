-- Migration: Criar função e trigger para atualizar inventory automaticamente
-- Data: 2025-01-XX
-- Descrição: Atualiza quantidade e last_movement_date em inventory quando há movimentação

-- Função para atualizar estoque quando há movimentação
CREATE OR REPLACE FUNCTION public.update_inventory_on_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_current_quantity DECIMAL(10,2);
BEGIN
    -- Verificar se registro de inventory existe
    SELECT quantity INTO v_current_quantity
    FROM public.inventory
    WHERE institution_id = NEW.institution_id
      AND product_id = NEW.product_id;

    IF v_current_quantity IS NULL THEN
        -- Criar registro de inventory se não existir
        INSERT INTO public.inventory (institution_id, product_id, quantity, last_movement_date)
        VALUES (
            NEW.institution_id,
            NEW.product_id,
            CASE WHEN NEW.movement_type = 'ENTRADA' THEN NEW.quantity ELSE 0 END,
            NEW.movement_date
        )
        ON CONFLICT (institution_id, product_id) DO NOTHING;
    ELSE
        -- Atualizar quantidade existente
        IF NEW.movement_type = 'ENTRADA' THEN
            -- ENTRADA: somar quantidade
            UPDATE public.inventory
            SET 
                quantity = quantity + NEW.quantity,
                last_movement_date = NEW.movement_date,
                updated_at = NOW()
            WHERE institution_id = NEW.institution_id
              AND product_id = NEW.product_id;
        ELSIF NEW.movement_type = 'SAIDA' THEN
            -- SAIDA: subtrair quantidade (com validação)
            IF v_current_quantity < NEW.quantity THEN
                RAISE EXCEPTION 'Estoque insuficiente. Quantidade disponível: %, quantidade solicitada: %', 
                    v_current_quantity, NEW.quantity;
            END IF;
            
            UPDATE public.inventory
            SET 
                quantity = quantity - NEW.quantity,
                last_movement_date = NEW.movement_date,
                updated_at = NOW()
            WHERE institution_id = NEW.institution_id
              AND product_id = NEW.product_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que executa após inserção de movimentação
CREATE TRIGGER trigger_update_inventory_on_movement
    AFTER INSERT ON public.stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_inventory_on_movement();

-- Comentário
COMMENT ON FUNCTION public.update_inventory_on_movement() IS 
'Função trigger que atualiza automaticamente a quantidade e data da última movimentação em inventory quando há uma nova movimentação de estoque. Valida estoque suficiente para saídas.';

