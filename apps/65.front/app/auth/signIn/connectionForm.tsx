"use client";

import { FormInput } from "@/components/form/formInput";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
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
  const { isLoaded, signIn, setActive } = useSignIn();
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.infer<typeof connectionFormSchema>>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(connectionFormSchema),
  });

  const signInError = (e: string) => {
    console.error(e);
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
        if (!signIn) return;
        const result = await signIn.create({
          identifier: data.email,
          password: data.password,
        });

        if (
          result.status === "complete" &&
          result.createdSessionId &&
          setActive
        ) {
          await setActive({
            session: result.createdSessionId,
            redirectUrl: "/",
          });
        } else {
          signInError("");
          toast.error("Erreur lors de la connexion");
        }
      } catch (err) {
        signInError(err as string);
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
          disabled={isPending || !isLoaded}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
        />
        <FormInput
          label="Mot de passe"
          placeholder="Votre mot de passe"
          disabled={isPending || !isLoaded}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <Button
          type="submit"
          className="mt-1 w-full"
          disabled={isPending || !isLoaded}
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
