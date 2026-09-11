import type { AutosaveStatus as Status } from "@/hook/useAdminAutosave";
import { AlertCircle, CheckCircle2, Clock, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const labels: Record<Status, string> = {
  idle: "Enregistrement automatique",
  queued: "Modifications en attente…",
  saving: "Enregistrement…",
  saved: "Modifications enregistrées",
  error: "Échec de l’enregistrement. Votre saisie est conservée ici.",
  invalid: "Corrigez les champs signalés pour enregistrer.",
};

export default function AutosaveStatus({
  status,
  onRetry,
}: {
  status: Status;
  onRetry: () => void;
}) {
  const Icon =
    status === "saving"
      ? LoaderCircle
      : status === "error" || status === "invalid"
        ? AlertCircle
        : status === "queued"
          ? Clock
          : CheckCircle2;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p
        role="status"
        className={`flex items-start gap-1.5 text-xs font-medium leading-5 ${status === "error" || status === "invalid" ? "text-destructive" : "text-muted-foreground"}`}
      >
        <Icon
          className={`mt-0.5 size-4 shrink-0 ${status === "saving" ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        {labels[status]}
      </p>
      {status === "error" && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}
