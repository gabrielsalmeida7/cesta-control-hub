/**
 * Componente temporário para tornar o bucket receipts privado
 * 
 * Este componente pode ser usado uma vez para tornar o bucket privado.
 * Depois pode ser removido ou mantido para uso futuro.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { makeReceiptsBucketPrivate } from '@/utils/makeBucketPrivate';
import { Loader2 } from 'lucide-react';

export const MakeBucketPrivateButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleMakePrivate = async () => {
    setIsLoading(true);
    try {
      await makeReceiptsBucketPrivate();
      toast({
        title: "Sucesso",
        description: "Bucket 'receipts' agora é privado!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao tornar bucket privado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleMakePrivate}
      disabled={isLoading}
      variant="outline"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Tornando privado...
        </>
      ) : (
        "Tornar Bucket Receipts Privado"
      )}
    </Button>
  );
};

