"use client";

import { FormInput } from "@/components/form/formInput";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const connectionFormSchema = z.object({
  email: z.string().min(1, "L'email est obligatoire"),
  password: z.string().min(1, "Le mot de passe est obligatoire"),
});

const ConnectionForm = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
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
        message: "email ou mot de passe incorrect",
      },
      { shouldFocus: true }
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

        if (result.status === "complete" && setActive) {
          await setActive({ session: result.createdSessionId! });
          router.push("/");
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
        className="grid grid-cols-1 gap-4"
      >
        <FormInput
          label="Identifiant"
          placeholder="Identifiant"
          disabled={isPending || !isLoaded}
          name="email"
          type="text"
          className="bg-white"
          required
        />
        <FormInput
          label="Mot de passe"
          placeholder="Mot de passe"
          disabled={isPending || !isLoaded}
          name="password"
          type="password"
          className="bg-white"
          required
        />
        <Button type="submit" disabled={isPending || !isLoaded}>
          Valider
        </Button>
      </form>
    </Form>
  );
};

export default ConnectionForm;
