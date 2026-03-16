import { useEffect, useState } from 'react';
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
import { updateClient, type Client } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const editClientSchema = z.object({
  name: z.string().min(1, 'Client name cannot be empty'),
});

export type EditClientFormValues = z.infer<typeof editClientSchema>;

type EditClientModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSuccess?: (client: Client) => void;
  language?: 'en' | 'es';
};

const EditClientModal = ({
  open,
  onOpenChange,
  client,
  onSuccess,
  language = 'en',
}: EditClientModalProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<EditClientFormValues>({
    resolver: zodResolver(editClientSchema),
    defaultValues: { name: '' },
  });

  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (open && client) {
      form.reset({ name: client.name ?? '' });
      setSubmitError(null);
    }
  }, [open, client, form]);

  const handleOpenChange = (next: boolean) => {
    if (!isSubmitting) {
      setSubmitError(null);
      if (!next) form.reset({ name: client?.name ?? '' });
      onOpenChange(next);
    }
  };

  const onSubmit = async (values: EditClientFormValues) => {
    setSubmitError(null);
    if (!client) return;
    const name = values.name.trim();
    try {
      const updated = await updateClient(client.id, { name });
      toast({
        title: language === 'es' ? 'Cliente actualizado' : 'Client updated',
        description:
          language === 'es'
            ? 'El cliente se ha actualizado correctamente.'
            : 'The client has been updated successfully.',
      });
      form.reset({ name });
      onOpenChange(false);
      onSuccess?.(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setSubmitError(message);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'es' ? 'Editar cliente' : 'Edit Client'}
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
              <Button type="submit" disabled={isSubmitting}>
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

export default EditClientModal;
