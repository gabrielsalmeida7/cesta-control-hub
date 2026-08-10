import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface FamilyReportOption {
  id: string;
  name: string;
  contact_person?: string | null;
}

interface FamilyReportSelectorProps {
  families: FamilyReportOption[];
  value: string;
  onValueChange: (familyId: string) => void;
  allowAll?: boolean;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export const FamilyReportSelector = ({
  families,
  value,
  onValueChange,
  allowAll = false,
  required = false,
  disabled = false,
  id = 'report-family',
}: FamilyReportSelectorProps) => {
  const [open, setOpen] = useState(false);

  const sortedFamilies = useMemo(
    () =>
      [...families].sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
      ),
    [families]
  );

  const selectedFamily = sortedFamilies.find((family) => family.id === value);

  const triggerLabel = (() => {
    if (value === 'all') return 'Todas as famílias';
    if (selectedFamily) {
      return selectedFamily.contact_person
        ? `${selectedFamily.name} (${selectedFamily.contact_person})`
        : selectedFamily.name;
    }
    return required ? 'Selecione uma família' : 'Todas as famílias';
  })();

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        Família{required ? ' *' : ''}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || sortedFamilies.length === 0}
            className={cn(
              'w-full justify-between font-normal',
              !value && required && 'text-muted-foreground'
            )}
          >
            <span className="truncate text-left">
              {sortedFamilies.length === 0
                ? 'Nenhuma família vinculada'
                : triggerLabel}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[min(calc(100vw-2rem),500px)]" align="start">
          <Command shouldFilter>
            <CommandInput placeholder="Buscar por nome ou contato..." />
            <CommandList>
              <CommandEmpty>Nenhuma família encontrada.</CommandEmpty>
              <CommandGroup>
                {allowAll ? (
                  <CommandItem
                    value="todas as familias"
                    onSelect={() => {
                      onValueChange('all');
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        value === 'all' ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    Todas as famílias
                  </CommandItem>
                ) : null}
                {sortedFamilies.map((family) => {
                  const searchBlob = [family.name, family.contact_person, family.id]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <CommandItem
                      key={family.id}
                      value={searchBlob}
                      onSelect={() => {
                        onValueChange(family.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 shrink-0',
                          value === family.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate font-medium">{family.name}</span>
                        {family.contact_person ? (
                          <span className="truncate text-xs text-muted-foreground">
                            {family.contact_person}
                          </span>
                        ) : null}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {required ? (
        <p className="text-xs text-muted-foreground">
          Selecione a família para gerar o relatório de itens entregues.
        </p>
      ) : null}
    </div>
  );
};

export const slugifyFamilyName = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 50)
    .toLowerCase();
