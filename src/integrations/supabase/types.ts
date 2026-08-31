export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          changed_fields: string[] | null
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          request_path: string | null
          severity: string | null
          table_name: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action_type: string
          changed_fields?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          request_path?: string | null
          severity?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action_type?: string
          changed_fields?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          request_path?: string | null
          severity?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      beneficiary_institutions: {
        Row: {
          address: string | null
          address_complement: string | null
          address_number: string | null
          address_proof_file_path: string | null
          audience_profile: string[] | null
          city: string | null
          cnpj: string | null
          cnpj_card_file_path: string | null
          created_at: string | null
          created_by_user_id: string | null
          document_review_by_user_id: string | null
          document_review_date: string | null
          election_minutes_file_path: string | null
          email: string | null
          families_served_count: number | null
          foundation_date: string | null
          full_name: string
          id: string
          institution_id: string
          legal_acceptance: boolean | null
          legal_acceptance_at: string | null
          legal_acceptance_ip: string | null
          legal_nature: string | null
          legal_nature_other: string | null
          legal_rep_document_file_path: string | null
          main_activity_areas: string[] | null
          negative_certificates_file_path: string | null
          neighborhood: string | null
          norms_accepted: boolean | null
          people_served_count: number | null
          phone_fixed: string | null
          phone_mobile: string | null
          reference_point: string | null
          registration_status: string | null
          responsible_cpf: string | null
          responsible_email: string | null
          responsible_name: string | null
          responsible_phone: string | null
          responsible_rg: string | null
          responsible_role: string | null
          service_frequency: string | null
          social_media: string | null
          state: string | null
          statute_file_path: string | null
          street: string | null
          technical_notes: string | null
          technical_visit_done: boolean | null
          terms_accepted: boolean | null
          trade_name: string | null
          treasurer_name: string | null
          updated_at: string | null
          vice_president_name: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          address_proof_file_path?: string | null
          audience_profile?: string[] | null
          city?: string | null
          cnpj?: string | null
          cnpj_card_file_path?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          document_review_by_user_id?: string | null
          document_review_date?: string | null
          election_minutes_file_path?: string | null
          email?: string | null
          families_served_count?: number | null
          foundation_date?: string | null
          full_name: string
          id?: string
          institution_id: string
          legal_acceptance?: boolean | null
          legal_acceptance_at?: string | null
          legal_acceptance_ip?: string | null
          legal_nature?: string | null
          legal_nature_other?: string | null
          legal_rep_document_file_path?: string | null
          main_activity_areas?: string[] | null
          negative_certificates_file_path?: string | null
          neighborhood?: string | null
          norms_accepted?: boolean | null
          people_served_count?: number | null
          phone_fixed?: string | null
          phone_mobile?: string | null
          reference_point?: string | null
          registration_status?: string | null
          responsible_cpf?: string | null
          responsible_email?: string | null
          responsible_name?: string | null
          responsible_phone?: string | null
          responsible_rg?: string | null
          responsible_role?: string | null
          service_frequency?: string | null
          social_media?: string | null
          state?: string | null
          statute_file_path?: string | null
          street?: string | null
          technical_notes?: string | null
          technical_visit_done?: boolean | null
          terms_accepted?: boolean | null
          trade_name?: string | null
          treasurer_name?: string | null
          updated_at?: string | null
          vice_president_name?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          address_proof_file_path?: string | null
          audience_profile?: string[] | null
          city?: string | null
          cnpj?: string | null
          cnpj_card_file_path?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          document_review_by_user_id?: string | null
          document_review_date?: string | null
          election_minutes_file_path?: string | null
          email?: string | null
          families_served_count?: number | null
          foundation_date?: string | null
          full_name?: string
          id?: string
          institution_id?: string
          legal_acceptance?: boolean | null
          legal_acceptance_at?: string | null
          legal_acceptance_ip?: string | null
          legal_nature?: string | null
          legal_nature_other?: string | null
          legal_rep_document_file_path?: string | null
          main_activity_areas?: string[] | null
          negative_certificates_file_path?: string | null
          neighborhood?: string | null
          norms_accepted?: boolean | null
          people_served_count?: number | null
          phone_fixed?: string | null
          phone_mobile?: string | null
          reference_point?: string | null
          registration_status?: string | null
          responsible_cpf?: string | null
          responsible_email?: string | null
          responsible_name?: string | null
          responsible_phone?: string | null
          responsible_rg?: string | null
          responsible_role?: string | null
          service_frequency?: string | null
          social_media?: string | null
          state?: string | null
          statute_file_path?: string | null
          street?: string | null
          technical_notes?: string | null
          technical_visit_done?: boolean | null
          terms_accepted?: boolean | null
          trade_name?: string | null
          treasurer_name?: string | null
          updated_at?: string | null
          vice_president_name?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beneficiary_institutions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_change_log: {
        Row: {
          change_at: string | null
          change_type: string
          changed_by_user_id: string | null
          details: Json | null
          family_id: string
          id: string
        }
        Insert: {
          change_at?: string | null
          change_type: string
          changed_by_user_id?: string | null
          details?: Json | null
          family_id: string
          id?: string
        }
        Update: {
          change_at?: string | null
          change_type?: string
          changed_by_user_id?: string | null
          details?: Json | null
          family_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_change_log_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "consent_audit"
            referencedColumns: ["family_id"]
          },
          {
            foreignKeyName: "consent_change_log_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_change_log_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families_eligible_for_deletion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_change_log_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families_with_cpf"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          blocking_justification: string | null
          blocking_period_days: number
          created_at: string | null
          delivered_by_user_id: string | null
          delivery_date: string | null
          family_id: string
          id: string
          institution_id: string
          notes: string | null
          receipt_id: string | null
        }
        Insert: {
          blocking_justification?: string | null
          blocking_period_days?: number
          created_at?: string | null
          delivered_by_user_id?: string | null
          delivery_date?: string | null
          family_id: string
          id?: string
          institution_id: string
          notes?: string | null
          receipt_id?: string | null
        }
        Update: {
          blocking_justification?: string | null
          blocking_period_days?: number
          created_at?: string | null
          delivered_by_user_id?: string | null
          delivery_date?: string | null
          family_id?: string
          id?: string
          institution_id?: string
          notes?: string | null
          receipt_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "consent_audit"
            referencedColumns: ["family_id"]
          },
          {
            foreignKeyName: "deliveries_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families_eligible_for_deletion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families_with_cpf"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          address: string | null
          address_reference: string | null
          birth_date: string | null
          block_reason: string | null
          blocked_by_institution_id: string | null
          blocked_until: string | null
          children_ages: Json | null
          children_count: number | null
          chronic_disease_description: string | null
          consent_given_at: string | null
          consent_revocation_reason: string | null
          consent_revoked_at: string | null
          consent_term_generated_at: string | null
          consent_term_id: string | null
          consent_term_signed: boolean | null
          construction_type: string | null
          contact_person: string
          cpf: string | null
          cpf_encrypted: string | null
          created_at: string | null
          family_composition: number | null
          family_composition_notes: string | null
          family_income: string | null
          food_insecurity: boolean | null
          formal_employment: boolean | null
          has_chronic_disease: boolean | null
          has_disability: boolean | null
          has_electricity: boolean | null
          has_garbage_collection: boolean | null
          has_water_supply: boolean | null
          housing_type: string | null
          id: string
          id_document: string | null
          is_blocked: boolean | null
          members_count: number | null
          mother_name: string | null
          name: string
          occupation: string | null
          origin_institution_id: string | null
          other_aid_description: string | null
          other_institution_name: string | null
          other_vulnerabilities: string | null
          phone: string | null
          poor_health: boolean | null
          receives_auxilio_gas: boolean | null
          receives_bolsa_familia: boolean | null
          receives_bpc: boolean | null
          receives_government_aid: boolean | null
          receives_loas: boolean | null
          receives_other_aid: boolean | null
          registered_in_other_institution: boolean | null
          substance_abuse: boolean | null
          unblock_reason: string | null
          unblocked_at: string | null
          unblocked_by_user_id: string | null
          unemployment: boolean | null
          updated_at: string | null
          work_situation: string | null
          working_count: number | null
        }
        Insert: {
          address?: string | null
          address_reference?: string | null
          birth_date?: string | null
          block_reason?: string | null
          blocked_by_institution_id?: string | null
          blocked_until?: string | null
          children_ages?: Json | null
          children_count?: number | null
          chronic_disease_description?: string | null
          consent_given_at?: string | null
          consent_revocation_reason?: string | null
          consent_revoked_at?: string | null
          consent_term_generated_at?: string | null
          consent_term_id?: string | null
          consent_term_signed?: boolean | null
          construction_type?: string | null
          contact_person: string
          cpf?: string | null
          cpf_encrypted?: string | null
          created_at?: string | null
          family_composition?: number | null
          family_composition_notes?: string | null
          family_income?: string | null
          food_insecurity?: boolean | null
          formal_employment?: boolean | null
          has_chronic_disease?: boolean | null
          has_disability?: boolean | null
          has_electricity?: boolean | null
          has_garbage_collection?: boolean | null
          has_water_supply?: boolean | null
          housing_type?: string | null
          id?: string
          id_document?: string | null
          is_blocked?: boolean | null
          members_count?: number | null
          mother_name?: string | null
          name: string
          occupation?: string | null
          origin_institution_id?: string | null
          other_aid_description?: string | null
          other_institution_name?: string | null
          other_vulnerabilities?: string | null
          phone?: string | null
          poor_health?: boolean | null
          receives_auxilio_gas?: boolean | null
          receives_bolsa_familia?: boolean | null
          receives_bpc?: boolean | null
          receives_government_aid?: boolean | null
          receives_loas?: boolean | null
          receives_other_aid?: boolean | null
          registered_in_other_institution?: boolean | null
          substance_abuse?: boolean | null
          unblock_reason?: string | null
          unblocked_at?: string | null
          unblocked_by_user_id?: string | null
          unemployment?: boolean | null
          updated_at?: string | null
          work_situation?: string | null
          working_count?: number | null
        }
        Update: {
          address?: string | null
          address_reference?: string | null
          birth_date?: string | null
          block_reason?: string | null
          blocked_by_institution_id?: string | null
          blocked_until?: string | null
          children_ages?: Json | null
          children_count?: number | null
          chronic_disease_description?: string | null
          consent_given_at?: string | null
          consent_revocation_reason?: string | null
          consent_revoked_at?: string | null
          consent_term_generated_at?: string | null
          consent_term_id?: string | null
          consent_term_signed?: boolean | null
          construction_type?: string | null
          contact_person?: string
          cpf?: string | null
          cpf_encrypted?: string | null
          created_at?: string | null
          family_composition?: number | null
          family_composition_notes?: string | null
          family_income?: string | null
          food_insecurity?: boolean | null
          formal_employment?: boolean | null
          has_chronic_disease?: boolean | null
          has_disability?: boolean | null
          has_electricity?: boolean | null
          has_garbage_collection?: boolean | null
          has_water_supply?: boolean | null
          housing_type?: string | null
          id?: string
          id_document?: string | null
          is_blocked?: boolean | null
          members_count?: number | null
          mother_name?: string | null
          name?: string
          occupation?: string | null
          origin_institution_id?: string | null
          other_aid_description?: string | null
          other_institution_name?: string | null
          other_vulnerabilities?: string | null
          phone?: string | null
          poor_health?: boolean | null
          receives_auxilio_gas?: boolean | null
          receives_bolsa_familia?: boolean | null
          receives_bpc?: boolean | null
          receives_government_aid?: boolean | null
          receives_loas?: boolean | null
          receives_other_aid?: boolean | null
          registered_in_other_institution?: boolean | null
          substance_abuse?: boolean | null
          unblock_reason?: string | null
          unblocked_at?: string | null
          unblocked_by_user_id?: string | null
          unemployment?: boolean | null
          updated_at?: string | null
          work_situation?: string | null
          working_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "families_blocked_by_institution_id_fkey"
            columns: ["blocked_by_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "families_origin_institution_id_fkey"
            columns: ["origin_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_families: {
        Row: {
          created_at: string | null
          family_id: string
          institution_id: string
        }
        Insert: {
          created_at?: string | null
          family_id: string
          institution_id: string
        }
        Update: {
          created_at?: string | null
          family_id?: string
          institution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_families_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "consent_audit"
            referencedColumns: ["family_id"]
          },
          {
            foreignKeyName: "institution_families_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_families_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families_eligible_for_deletion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_families_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families_with_cpf"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_families_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          responsible_name: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          responsible_name?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          responsible_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string | null
          id: string
          institution_id: string
          last_movement_date: string | null
          product_id: string
          quantity: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          institution_id: string
          last_movement_date?: string | null
          product_id: string
          quantity?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          institution_id?: string
          last_movement_date?: string | null
          product_id?: string
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          institution_id: string
          is_active: boolean | null
          name: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          institution_id: string
          is_active?: boolean | null
          name: string
          unit: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean | null
          name?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          institution_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string
          id: string
          institution_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          institution_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          file_path: string | null
          file_url: string | null
          generated_at: string | null
          generated_by_user_id: string | null
          id: string
          institution_id: string
          receipt_type: string
          reference_id: string
        }
        Insert: {
          file_path?: string | null
          file_url?: string | null
          generated_at?: string | null
          generated_by_user_id?: string | null
          id?: string
          institution_id: string
          receipt_type: string
          reference_id: string
        }
        Update: {
          file_path?: string | null
          file_url?: string | null
          generated_at?: string | null
          generated_by_user_id?: string | null
          id?: string
          institution_id?: string
          receipt_type?: string
          reference_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          beneficiary_institution_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by_user_id: string | null
          created_at: string | null
          created_by_user_id: string | null
          delivery_id: string | null
          id: string
          institution_id: string
          movement_date: string
          movement_type: string
          notes: string | null
          product_id: string
          quantity: number
          status: string
          supplier_id: string | null
        }
        Insert: {
          beneficiary_institution_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by_user_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          delivery_id?: string | null
          id?: string
          institution_id: string
          movement_date?: string
          movement_type: string
          notes?: string | null
          product_id: string
          quantity: number
          status?: string
          supplier_id?: string | null
        }
        Update: {
          beneficiary_institution_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by_user_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          delivery_id?: string | null
          id?: string
          institution_id?: string
          movement_date?: string
          movement_type?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          status?: string
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_beneficiary_institution_id_fkey"
            columns: ["beneficiary_institution_id"]
            isOneToOne: false
            referencedRelation: "beneficiary_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          document: string | null
          id: string
          institution_id: string
          name: string
          notes: string | null
          supplier_type: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          document?: string | null
          id?: string
          institution_id: string
          name: string
          notes?: string | null
          supplier_type: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          document?: string | null
          id?: string
          institution_id?: string
          name?: string
          notes?: string | null
          supplier_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      audit_by_user: {
        Row: {
          critical_actions: number | null
          delete_actions: number | null
          last_action_at: string | null
          total_actions: number | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Relationships: []
      }
      audit_critical_actions: {
        Row: {
          action_type: string | null
          created_at: string | null
          description: string | null
          id: string | null
          record_id: string | null
          severity: string | null
          table_name: string | null
          user_email: string | null
          user_role: string | null
        }
        Insert: {
          action_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          record_id?: string | null
          severity?: string | null
          table_name?: string | null
          user_email?: string | null
          user_role?: string | null
        }
        Update: {
          action_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          record_id?: string | null
          severity?: string | null
          table_name?: string | null
          user_email?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      audit_data_access: {
        Row: {
          action_type: string | null
          created_at: string | null
          data_type: string | null
          description: string | null
          id: string | null
          record_id: string | null
          table_name: string | null
          user_email: string | null
        }
        Insert: {
          action_type?: string | null
          created_at?: string | null
          data_type?: never
          description?: string | null
          id?: string | null
          record_id?: string | null
          table_name?: string | null
          user_email?: string | null
        }
        Update: {
          action_type?: string | null
          created_at?: string | null
          data_type?: never
          description?: string | null
          id?: string | null
          record_id?: string | null
          table_name?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      consent_audit: {
        Row: {
          consent_given_at: string | null
          consent_revocation_reason: string | null
          consent_revoked_at: string | null
          consent_status: string | null
          consent_term_generated_at: string | null
          consent_term_id: string | null
          consent_term_signed: boolean | null
          cpf: string | null
          family_created_at: string | null
          family_id: string | null
          family_name: string | null
        }
        Insert: {
          consent_given_at?: string | null
          consent_revocation_reason?: string | null
          consent_revoked_at?: string | null
          consent_status?: never
          consent_term_generated_at?: string | null
          consent_term_id?: string | null
          consent_term_signed?: boolean | null
          cpf?: string | null
          family_created_at?: string | null
          family_id?: string | null
          family_name?: string | null
        }
        Update: {
          consent_given_at?: string | null
          consent_revocation_reason?: string | null
          consent_revoked_at?: string | null
          consent_status?: never
          consent_term_generated_at?: string | null
          consent_term_id?: string | null
          consent_term_signed?: boolean | null
          cpf?: string | null
          family_created_at?: string | null
          family_id?: string | null
          family_name?: string | null
        }
        Relationships: []
      }
      families_eligible_for_deletion: {
        Row: {
          created_at: string | null
          days_inactive: number | null
          id: string | null
          last_delivery_date: string | null
          name: string | null
          retention_status: string | null
        }
        Relationships: []
      }
      families_with_cpf: {
        Row: {
          address: string | null
          blocked_by_institution_id: string | null
          blocked_until: string | null
          contact_person: string | null
          cpf: string | null
          cpf_formatted: string | null
          created_at: string | null
          id: string | null
          is_blocked: boolean | null
          members_count: number | null
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          blocked_by_institution_id?: string | null
          blocked_until?: string | null
          contact_person?: string | null
          cpf?: never
          cpf_formatted?: never
          created_at?: string | null
          id?: string | null
          is_blocked?: boolean | null
          members_count?: number | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          blocked_by_institution_id?: string | null
          blocked_until?: string | null
          contact_person?: string | null
          cpf?: never
          cpf_formatted?: never
          created_at?: string | null
          id?: string | null
          is_blocked?: boolean | null
          members_count?: number | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "families_blocked_by_institution_id_fkey"
            columns: ["blocked_by_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      anonymize_family: {
        Args: { p_family_id: string; p_reason?: string }
        Returns: boolean
      }
      anonymize_inactive_families: {
        Args: { p_inactive_days?: number }
        Returns: {
          anonymized_count: number
          error_count: number
        }[]
      }
      associate_family_institution: {
        Args: { p_family_id: string; p_institution_id: string }
        Returns: Json
      }
      audit_log: {
        Args: {
          p_action_type: string
          p_description?: string
          p_new_data?: Json
          p_old_data?: Json
          p_record_id?: string
          p_severity?: string
          p_table_name?: string
        }
        Returns: string
      }
      auto_unblock_expired_families: { Args: never; Returns: number }
      get_family_institution_links: {
        Args: { p_family_id: string }
        Returns: {
          institution_id: string
          institution_name: string
          created_at: string
          is_origin: boolean
        }[]
      }
      get_families_for_institution: {
        Args: { p_institution_id: string }
        Returns: Json
      }
      get_family_for_institution: {
        Args: { p_family_id: string }
        Returns: Json
      }
      count_institution_blocked_families: {
        Args: { p_institution_id: string }
        Returns: number
      }
      get_institution_dashboard_stats: {
        Args: { p_institution_id: string }
        Returns: Json
      }
      get_admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_families_display_batch: {
        Args: { p_family_ids: string[] }
        Returns: {
          id: string
          name: string
          contact_person: string
          members_count: number
          is_blocked: boolean
          blocked_until: string | null
          block_reason: string | null
          blocked_by_institution_name: string | null
        }[]
      }
      get_families_multi_institution: {
        Args: { p_institution_id?: string | null }
        Returns: Json
      }
      check_family_field_duplicate: {
        Args: {
          p_field: string
          p_value: string
          p_exclude_family_id?: string | null
        }
        Returns: {
          id: string
          name: string
        }[]
      }
      search_family_for_linking: {
        Args: {
          p_search_term: string
          p_search_by?: string
          p_current_institution_id?: string | null
        }
        Returns: {
          id: string
          name: string
          contact_person: string
          cpf_masked: string
          phone: string | null
          members_count: number
          is_linked_to_current: boolean
        }[]
      }
      bootstrap_admin: { Args: { admin_email: string }; Returns: boolean }
      can_deliver_to_family: {
        Args: { p_family_id: string; p_institution_id: string }
        Returns: Json
      }
      cancel_delivery_movements: {
        Args: { p_delivery_id: string; p_reason: string }
        Returns: number
      }
      cancel_stock_movement: {
        Args: { p_movement_id: string; p_reason: string }
        Returns: undefined
      }
      cleanup_old_audit_logs: {
        Args: { p_retention_days?: number }
        Returns: number
      }
      decrypt_cpf: { Args: { cpf_encrypted: string }; Returns: string }
      delete_family_permanently: {
        Args: { p_family_id: string; p_reason: string; p_requested_by?: string }
        Returns: Json
      }
      encrypt_cpf: { Args: { cpf_plain: string }; Returns: string }
      export_family_data: { Args: { p_family_id: string }; Returns: Json }
      find_family_by_cpf: {
        Args: { cpf_search: string }
        Returns: {
          address: string | null
          address_reference: string | null
          birth_date: string | null
          block_reason: string | null
          blocked_by_institution_id: string | null
          blocked_until: string | null
          children_ages: Json | null
          children_count: number | null
          chronic_disease_description: string | null
          consent_given_at: string | null
          consent_revocation_reason: string | null
          consent_revoked_at: string | null
          consent_term_generated_at: string | null
          consent_term_id: string | null
          consent_term_signed: boolean | null
          construction_type: string | null
          contact_person: string
          cpf: string | null
          cpf_encrypted: string | null
          created_at: string | null
          family_composition: number | null
          family_composition_notes: string | null
          family_income: string | null
          food_insecurity: boolean | null
          formal_employment: boolean | null
          has_chronic_disease: boolean | null
          has_disability: boolean | null
          has_electricity: boolean | null
          has_garbage_collection: boolean | null
          has_water_supply: boolean | null
          housing_type: string | null
          id: string
          id_document: string | null
          is_blocked: boolean | null
          members_count: number | null
          mother_name: string | null
          name: string
          occupation: string | null
          origin_institution_id: string | null
          other_aid_description: string | null
          other_institution_name: string | null
          other_vulnerabilities: string | null
          phone: string | null
          poor_health: boolean | null
          receives_auxilio_gas: boolean | null
          receives_bolsa_familia: boolean | null
          receives_bpc: boolean | null
          receives_government_aid: boolean | null
          receives_loas: boolean | null
          receives_other_aid: boolean | null
          registered_in_other_institution: boolean | null
          substance_abuse: boolean | null
          unblock_reason: string | null
          unblocked_at: string | null
          unblocked_by_user_id: string | null
          unemployment: boolean | null
          updated_at: string | null
          work_situation: string | null
          working_count: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "families"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      format_cpf: { Args: { cpf_plain: string }; Returns: string }
      get_encryption_key: { Args: never; Returns: string }
      get_user_institution: { Args: { user_id: string }; Returns: string }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_valid_consent: { Args: { family_id: string }; Returns: boolean }
      is_bypass_user: { Args: { user_id: string }; Returns: boolean }
      link_institution_user: {
        Args: {
          p_institution_id: string
          p_responsible_name: string
          p_user_id: string
        }
        Returns: boolean
      }
      migrate_cpf_to_encrypted: {
        Args: never
        Returns: {
          error_count: number
          migrated_count: number
        }[]
      }
      reverse_inventory_on_movement_cancellation: {
        Args: {
          p_institution_id: string
          p_movement_date: string
          p_movement_type: string
          p_product_id: string
          p_quantity: number
        }
        Returns: undefined
      }
      revoke_consent_and_delete: {
        Args: { p_family_id: string; p_revocation_reason: string }
        Returns: Json
      }
      unblock_family: {
        Args: { p_family_id: string; p_reason?: string }
        Returns: Json
      }
      validate_cpf_format: { Args: { cpf_text: string }; Returns: boolean }
      validate_delivery:
        | {
            Args: { p_family_id: string; p_institution_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_blocking_justification?: string
              p_family_id: string
              p_institution_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_blocking_justification?: string
              p_blocking_period_days?: number
              p_family_id: string
              p_institution_id: string
            }
            Returns: Json
          }
      validate_institution_user_creation: {
        Args: { p_email: string }
        Returns: boolean
      }
    }
    Enums: {
      blocking_period: "7" | "15" | "20" | "30" | "45"
      user_role: "admin" | "institution"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      blocking_period: ["7", "15", "20", "30", "45"],
      user_role: ["admin", "institution"],
    },
  },
} as const
