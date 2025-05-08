
import React from 'react';
import { Calendar, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Family } from '../FamilyTable/FamilyTable';
import './DeliveryForm.css';

interface DeliveryFormValues {
  familyId: number;
  blockPeriod: string;
  basketCount: number;
  otherItems: string;
}

interface DeliveryFormProps {
  family: Family;
  maxBaskets: number;
  onSubmit: (data: DeliveryFormValues) => void;
  onCancel: () => void;
}

const DeliveryForm: React.FC<DeliveryFormProps> = ({ family, maxBaskets, onSubmit, onCancel }) => {
  const form = useForm<DeliveryFormValues>({
    defaultValues: {
      familyId: family.id,
      blockPeriod: "30",
      basketCount: 1,
      otherItems: ""
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="delivery-form">
        <div className="family-info">
          <p className="family-name">Família: {family.name}</p>
          <p className="family-members">Membros: {family.members} pessoas</p>
          <p className="family-cpf">CPF: {family.cpf}</p>
        </div>
        
        <FormField
          control={form.control}
          name="basketCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade de Cestas</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={maxBaskets}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="otherItems"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outros Itens (separados por vírgula)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Leite (2L), Arroz (5kg), Feijão (1kg)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="blockPeriod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Período de Bloqueio</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="45">45 dias</SelectItem>
                    <SelectItem value="60">60 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="block-notice">
          <p>
            <Calendar className="notice-icon" />
            A família ficará bloqueada por {form.watch("blockPeriod")} dias após esta entrega.
          </p>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="cancel-button"
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            className="confirm-button"
          >
            <Check className="button-icon" /> Confirmar Entrega
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default DeliveryForm;
