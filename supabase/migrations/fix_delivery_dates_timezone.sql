-- Migration: Corrigir timezone de datas de entrega antigas
-- Data: 2025-11-17
-- Descrição: Atualiza delivery_date de entregas que foram salvas apenas como data (YYYY-MM-DD)
-- para incluir hora do meio-dia em Brasília, garantindo que sejam exibidas corretamente

-- Atualizar entregas que têm apenas data (sem hora) ou que foram salvas incorretamente
-- Se a data foi salva como apenas YYYY-MM-DD, o PostgreSQL pode ter interpretado como meia-noite UTC
-- Vamos atualizar para meio-dia em Brasília (12:00 -03:00) para garantir consistência

UPDATE public.deliveries
SET delivery_date = (
  -- Extrair apenas a parte da data (YYYY-MM-DD) e adicionar hora do meio-dia em Brasília
  -- Usar timezone de Brasília explicitamente
  (delivery_date::date)::text || 'T12:00:00-03:00'::text
)::timestamptz
WHERE 
  -- Apenas atualizar se a data não tiver hora definida ou se for muito antiga (antes da correção)
  -- Verificar se a hora está próxima de meia-noite (pode indicar que foi salva apenas como data)
  EXTRACT(HOUR FROM delivery_date AT TIME ZONE 'America/Sao_Paulo') = 0
  AND EXTRACT(MINUTE FROM delivery_date AT TIME ZONE 'America/Sao_Paulo') = 0
  AND EXTRACT(SECOND FROM delivery_date AT TIME ZONE 'America/Sao_Paulo') < 1;

-- Comentário
COMMENT ON COLUMN public.deliveries.delivery_date IS 
'Data e hora da entrega. Deve ser salva com timezone de Brasília (America/Sao_Paulo) para garantir exibição correta.';

