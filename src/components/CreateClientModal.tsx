import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient, type Client } from '@/services/api';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const createClientSchema = z.object({
  name: z.string().min(1, 'Client name cannot be empty'),
});

export type CreateClientFormValues = z.infer<typeof createClientSchema>;

type CreateClientModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (client: Client) => void;
  language?: 'en' | 'es';
};

const CreateClientModal = ({
  open,
  onOpenChange,
  onSuccess,
  language = 'en',
}: CreateClientModalProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { toast } = useToast();
  const { agency } = useApp();

  const form = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: { name: '' },
  });

  const isSubmitting = form.formState.isSubmitting;
  const hasAgency = !!agency?.id;

  const handleOpenChange = (next: boolean) => {
    if (!isSubmitting) {
      setSubmitError(null);
      if (!next) form.reset({ name: '' });
      onOpenChange(next);
    }
  };

  const onSubmit = async (values: CreateClientFormValues) => {
    setSubmitError(null);
    if (!hasAgency) {
      setSubmitError(language === 'es' ? 'No hay agencia activa.' : 'No active agency.');
      return;
    }
    try {
      const client = await createClient({
        name: values.name.trim(),
        agency_id: agency!.id,
      });
      toast({
        title: language === 'es' ? 'Cliente creado' : 'Client created',
        description:
          language === 'es'
            ? 'El cliente se ha creado correctamente.'
            : 'The client has been created successfully.',
      });
      form.reset({ name: '' });
      onOpenChange(false);
      onSuccess?.(client);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setSubmitError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'es' ? 'Agregar cliente' : 'Add client'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {language === 'es' ? 'Nombre del cliente' : 'Client name'}
                    <span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        language === 'es'
                          ? 'Ej.: Mi Empresa'
                          : 'E.g.: My Company'
                      }
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {submitError && (
              <p className="text-sm font-medium text-destructive">{submitError}</p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={isSubmitting || !hasAgency}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {language === 'es' ? 'Guardando…' : 'Saving…'}
                  </>
                ) : (
                  language === 'es' ? 'Guardar' : 'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClientModal;
