"use client";

import { FormInput } from "@/components/form/formInput";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const connectionFormSchema = z.object({
  email: z
    .string()
    .min(1, "L’adresse e-mail est obligatoire")
    .email("Saisissez une adresse e-mail valide"),
  password: z.string().min(1, "Le mot de passe est obligatoire"),
});

const ConnectionForm = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.infer<typeof connectionFormSchema>>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(connectionFormSchema),
  });

  const signInError = () => {
    form.setValue("password", "");
    form.setError(
      "password",
      {
        type: "manual",
        message: "Adresse e-mail ou mot de passe incorrect.",
      },
      { shouldFocus: true },
    );
  };

  const onSubmit = (data: z.infer<typeof connectionFormSchema>) => {
    startTransition(async () => {
      try {
        const { error } = await authClient.signIn.email({
          email: data.email,
          password: data.password,
        });

        if (error) {
          signInError();
          toast.error("Erreur lors de la connexion");
          return;
        }

        router.replace("/");
        router.refresh();
      } catch {
        signInError();
        toast.error("Erreur lors de la connexion");
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onChange={() => form.clearErrors()}
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-5"
      >
        <FormInput
          label="Adresse e-mail"
          placeholder="vous@exemple.fr"
          disabled={isPending}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
        />
        <FormInput
          label="Mot de passe"
          placeholder="Votre mot de passe"
          disabled={isPending}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <Button
          type="submit"
          className="mt-1 w-full"
          disabled={isPending}
          aria-busy={isPending}
          static={isPending}
        >
          {isPending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <LockKeyhole aria-hidden="true" />
          )}
          {isPending ? "Connexion en cours…" : "Se connecter"}
        </Button>
        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <Mail className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Utilisez l’adresse associée à votre compte membre.
        </p>
      </form>
    </Form>
  );
};

export default ConnectionForm;
