import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Hook that sets up a Tauri event listener that automatically cleans up when the route changes.
 * This is useful for page-specific event listeners that should only be active on certain routes.
 * 
 * @param eventName - The name of the Tauri event to listen for
 * @param callback - Function to call when the event is received
 * @param dependencies - Additional dependencies that will trigger listener recreation
 */
export function useRouterTauriListener(
  eventName: string,
  callback: () => void,
  dependencies: unknown[] = [],
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

/**
 * Hook that sets up a Tauri event listener for triggering component re-renders.
 * This is a simple hook that forces a re-render when the specified event is received.
 * 
 * @param eventName - The name of the Tauri event to listen for
 */
export function useTauriReRenderListener(eventName: string) {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // Don't set up listener if eventName is empty
    if (!eventName) {
      return;
    }

    let mounted = true;
    let unlisten: (() => void) | null = null;

    async function setupListener() {
      unlisten = await listen(eventName, () => {
        if (mounted) {
          forceUpdate({});
        }
      });
    }

    setupListener();

    return () => {
      mounted = false;
      if (unlisten) {
        unlisten();
      }
    };
  }, [eventName]);
}

/**
 * Hook that sets up a global Tauri event listener that persists across route changes.
 * Unlike useRouterTauriListener, this listener remains active regardless of the current route.
 * 
 * @param eventName - The name of the Tauri event to listen for
 * @param callback - Function to call when the event is received
 * @param dependencies - Additional dependencies that will trigger listener recreation
 */
export function useWindowTauriListener(
  eventName: string,
  callback: () => void,
  dependencies: unknown[] = [],
) {
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
  }, [eventName, ...dependencies]);
}

/**
 * Hook that sets up a global Tauri event listener for drag and drop that persists across route changes.
 * Unlike useRouterTauriListener, this listener remains active regardless of the current route.
 * 
 * @param callback - Function to call when files are dropped, receives array of file paths
 */
export function useDragDropTauriListener(
  callback: (filePaths: string[]) => void,
) {
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
        const unlisten = await listen("tauri://drag-drop", (event) => {
          if (mounted && event.payload) {
            // The drag-drop event payload contains the file paths
            const filePaths = event.payload as string[];
            // @ts-expect-error - filePaths is an array of strings
            callback(filePaths.paths);
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
  }, [callback]);
}

/**
 * Hook that sets up a global Tauri event listener for navigation events.
 * 
 * @param callback - Function to call when navigation event is received, receives the path
 */
export function useNavigationTauriListener(
  callback: (path: string) => void,
) {
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
        const unlisten = await listen("navigate_to", (event) => {
          if (mounted && event.payload) {
            // The navigation event payload contains the path
            const path = event.payload as string;
            callback(path);
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
  }, [callback]);
}

