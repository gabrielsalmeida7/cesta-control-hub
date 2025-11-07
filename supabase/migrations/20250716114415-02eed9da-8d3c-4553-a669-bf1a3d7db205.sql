-- Passo 1: Atualizar datas das entregas existentes para serem recentes (últimos 30 dias)
UPDATE deliveries 
SET delivery_date = NOW() - INTERVAL '5 days',
    created_at = NOW() - INTERVAL '5 days'
WHERE delivery_date < NOW() - INTERVAL '30 days';

-- Passo 3: Adicionar entregas estratégicas para gerar alertas de fraude
-- Família recebendo de múltiplas instituições (para gerar alerta de fraude)
INSERT INTO deliveries (family_id, institution_id, delivery_date, created_at, blocking_period_days, delivered_by_user_id, notes)
SELECT 
  f.id as family_id,
  i.id as institution_id,
  NOW() - INTERVAL '3 days' as delivery_date,
  NOW() - INTERVAL '3 days' as created_at,
  30 as blocking_period_days,
  NULL as delivered_by_user_id,
  'Entrega para teste de alerta de fraude' as notes
FROM families f
CROSS JOIN institutions i
WHERE f.name = 'Família Silva'
  AND i.name IN ('Instituto Esperança', 'Fundação Solidariedade')
LIMIT 2;

-- Outra família recebendo de múltiplas instituições
INSERT INTO deliveries (family_id, institution_id, delivery_date, created_at, blocking_period_days, delivered_by_user_id, notes)
SELECT 
  f.id as family_id,
  i.id as institution_id,
  NOW() - INTERVAL '1 day' as delivery_date,
  NOW() - INTERVAL '1 day' as created_at,
  30 as blocking_period_days,
  NULL as delivered_by_user_id,
  'Segunda entrega para teste de alerta' as notes
FROM families f
CROSS JOIN institutions i
WHERE f.name = 'Família Santos'
  AND i.name IN ('Centro Assistencial São José', 'Associação Comunitária Norte', 'Casa de Apoio Acolher')
LIMIT 3;

-- Criar algumas famílias com bloqueios expirados
UPDATE families 
SET is_blocked = true,
    blocked_until = NOW() - INTERVAL '2 days',
    block_reason = 'Bloqueio teste para alertas'
WHERE name IN ('Família Oliveira', 'Família Costa');