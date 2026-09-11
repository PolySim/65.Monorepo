"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

export type AutosaveStatus =
  | "idle"
  | "queued"
  | "saving"
  | "saved"
  | "error"
  | "invalid";

// Serialize writes and only acknowledge the latest edit, including edits made
// while a previous request is still in flight.
export function useAdminAutosave<T extends FieldValues>(
  form: UseFormReturn<T>,
  save: (values: T) => Promise<{ success: boolean }>,
) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const callback = useRef(save);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revision = useRef(0);
  const acknowledged = useRef(0);
  const chain = useRef(Promise.resolve());
  const mounted = useRef(true);
  useEffect(() => {
    callback.current = save;
  }, [save]);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const currentRevision = revision.current;
    const saveValues = callback.current;
    chain.current = chain.current.then(async () => {
      if (currentRevision !== revision.current) return;
      if (mounted.current) setStatus("saving");
      try {
        await form.handleSubmit(
          async (values) => {
            const result = await saveValues(values);
            if (result.success) acknowledged.current = currentRevision;
            if (mounted.current && currentRevision === revision.current)
              setStatus(result.success ? "saved" : "error");
          },
          () => {
            if (mounted.current && currentRevision === revision.current)
              setStatus("invalid");
          },
        )();
      } catch {
        if (mounted.current && currentRevision === revision.current)
          setStatus("error");
      }
    });
  }, [form]);

  const schedule = useCallback(() => {
    revision.current += 1;
    setStatus("queued");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 1000);
  }, [flush]);

  useEffect(() => {
    mounted.current = true;
    const warnIfUnsaved = (event: BeforeUnloadEvent) => {
      if (acknowledged.current < revision.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warnIfUnsaved);
    return () => {
      mounted.current = false;
      window.removeEventListener("beforeunload", warnIfUnsaved);
      if (timer.current) flush();
    };
  }, [flush]);

  return { status, schedule, flush };
}
