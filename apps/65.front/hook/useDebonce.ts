import { useCallback, useEffect, useRef } from "react";

const useDebounce = (cb: Function, delay: number) => {
  const callbackRef = useRef<Function>(cb);

  useEffect(() => {
    callbackRef.current = cb;
  }, [cb]);

  return useCallback(
    (...args: any[]) => {
      const handler = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    },
    [delay]
  );
};

export default useDebounce;
