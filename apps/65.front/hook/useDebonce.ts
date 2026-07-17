import { useCallback, useEffect, useRef } from "react";

const useDebounce = <TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delay: number,
) => {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgsRef = useRef<TArgs | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    pendingArgsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (!pendingArgsRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const args = pendingArgsRef.current;
    timeoutRef.current = null;
    pendingArgsRef.current = null;
    callbackRef.current(...args);
  }, []);

  const schedule = useCallback(
    (...args: TArgs) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      pendingArgsRef.current = args;
      timeoutRef.current = setTimeout(flush, delay);
    },
    [delay, flush],
  );

  return { cancel, flush, schedule };
};

export default useDebounce;
