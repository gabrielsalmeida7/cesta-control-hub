/**
 * Hook para registro de logs de auditoria no Supabase
 * Integra com a função RPC audit_log do banco de dados
 */

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

type AuditActionType = 
  | 'INSERT' 
  | 'UPDATE' 
  | 'DELETE'
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'FAILED_LOGIN'
  | 'CONSENT_GIVEN' 
  | 'CONSENT_REVOKED'
  | 'DATA_ACCESS' 
  | 'DATA_EXPORT' 
  | 'DATA_DELETE'
  | 'FAMILY_UNBLOCK' 
  | 'DELIVERY_CREATE'
  | 'PASSWORD_RESET' 
  | 'PASSWORD_CHANGE'
  | 'INSTITUTION_CREATE'
  | 'INSTITUTION_UPDATE'
  | 'INSTITUTION_DELETE'
  | 'FAMILY_CREATE'
  | 'FAMILY_UPDATE'
  | 'FAMILY_DELETE';

type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

interface AuditLogParams {
  actionType: AuditActionType;
  tableName?: string;
  recordId?: string;
  description?: string;
  severity?: AuditSeverity;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

export const useAuditLog = () => {
  const { user, profile } = useAuth();

  const logAction = async (params: AuditLogParams) => {
    try {
      const {
        actionType,
        tableName,
        recordId,
        description,
        severity = 'INFO',
        oldData,
        newData,
      } = params;

      // Log local primeiro (para desenvolvimento)
      logger.audit(actionType, user?.id || 'unknown', {
        tableName,
        recordId,
        description,
        severity,
      });

      // Tentar registrar no Supabase via RPC
      // Nota: A função audit_log já captura user_id automaticamente via auth.uid()
      const { error } = await supabase.rpc('audit_log', {
        p_action_type: actionType,
        p_table_name: tableName || null,
        p_record_id: recordId || null,
        p_old_data: oldData ? (oldData as any) : null,
        p_new_data: newData ? (newData as any) : null,
        p_description: description || null,
        p_severity: severity,
      });

      if (error) {
        // Log erro mas não falhar a operação principal
        logger.error('Failed to log audit action', {
          actionType,
          error: error.message,
        }, 'AUDIT_LOG_ERROR', user?.id);
      }
    } catch (error: any) {
      // Log erro mas não falhar a operação principal
      logger.error('Exception while logging audit action', {
        actionType: params.actionType,
        error: error?.message || String(error),
      }, 'AUDIT_LOG_EXCEPTION', user?.id);
    }
  };

  return { logAction };
};

