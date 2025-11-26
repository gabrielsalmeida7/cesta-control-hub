/**
 * Script utilitário para tornar o bucket 'receipts' privado
 * 
 * Execute este script uma vez para tornar o bucket privado.
 * Requer VITE_SUPABASE_SERVICE_ROLE_KEY configurada no .env.local
 */

import { supabaseAdmin } from '@/integrations/supabase/admin';

export const makeReceiptsBucketPrivate = async (): Promise<void> => {
  if (!supabaseAdmin) {
    throw new Error(
      'VITE_SUPABASE_SERVICE_ROLE_KEY não está configurada. ' +
      'Adicione esta variável no arquivo .env.local e reinicie o servidor.'
    );
  }

  const bucketName = 'receipts';

  // Atualizar o bucket para ser privado
  const { data, error } = await supabaseAdmin.storage.updateBucket(bucketName, {
    public: false, // Tornar privado
  });

  if (error) {
    // Se o erro for que o bucket não existe, informar
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      throw new Error(`Bucket '${bucketName}' não encontrado. Crie o bucket primeiro no Supabase Dashboard.`);
    }
    throw new Error(`Erro ao tornar bucket privado: ${error.message}`);
  }

  console.log(`✅ Bucket '${bucketName}' agora é privado!`, data);
};

