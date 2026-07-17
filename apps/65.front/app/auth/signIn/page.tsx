import ConnectionForm from "./connectionForm";

export default function SignIn() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
        Bon retour parmi nous.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
        Connectez-vous pour retrouver vos activités, vos favoris et les outils
        de gestion qui vous sont attribués.
      </p>
      <div className="mt-8">
        <ConnectionForm />
      </div>
    </div>
  );
}
