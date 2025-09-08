import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function useTauriListener(
  eventName: string,
  callback: () => void,
  dependencies: any[] = []
) {
  const location = useLocation();
  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    async function setupListener() {
      // Clean up existing listener if any
      if (unlistenRef.current) {
        await unlistenRef.current();
        unlistenRef.current = null;
      }

      // Only set up the listener if we're on the relevant page
      if (mounted) {
        const unlisten = await listen(eventName, () => {
          if (mounted) {
            callback();
          }
        });
        unlistenRef.current = unlisten;
      }
    }

    setupListener();

    // Cleanup function
    return () => {
      mounted = false;
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, [eventName, location.pathname, ...dependencies]);
}
