
import React from 'react';
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Institution } from '../InstitutionCard/InstitutionCard';
import './InstitutionEditForm.css';

interface InstitutionEditFormProps {
  institution: Institution;
  onSubmit: (data: Institution) => void;
  onCancel: () => void;
  isAdmin: boolean;
}

const InstitutionEditForm: React.FC<InstitutionEditFormProps> = ({ 
  institution, 
  onSubmit, 
  onCancel,
  isAdmin 
}) => {
  const form = useForm<Institution>({
    defaultValues: {
      id: institution.id,
      name: institution.name,
      address: institution.address,
      phone: institution.phone,
      availableBaskets: institution.availableBaskets,
      color: institution.color
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="institution-form">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="availableBaskets"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cestas Disponíveis</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  value={field.value} 
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                  disabled={!isAdmin}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="cancel-button"
          >
            Cancelar
          </Button>
          <Button type="submit" className="submit-button">Salvar Alterações</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default InstitutionEditForm;
