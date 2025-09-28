import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Form } from "antd";

import { ChildProps, Identifiable } from "@suite-types/types";
import Reveal from "@animations/Reveal.tsx";
import { ListenToEvent } from "@tauri/listener.ts";

import NotificationProvider from "@components/NotificationProvider";

export type AlternativeStringCol<T, K extends keyof T> = T[K] extends string
  ? K
  : never;

export interface DataHandlingProps<T extends Identifiable> {
  id: string;
  fetchObject: (id: string) => Promise<T | undefined>;
  updateObject: (id: string, data: T) => Promise<void>;
  deleteObject?: (id: string) => Promise<void>;
  saveObject?: (id: string) => Promise<void>;
  alternativeIdCol?: AlternativeStringCol<T, keyof T> | string;
  targetKey: string;
}

interface DataFetchProps<T extends Identifiable> extends DataHandlingProps<T> {
  children: React.ReactNode;
  context: React.Context<ChildProps<T>>;
}

export default function DataProvider<T extends Identifiable>({
  id,
  fetchObject,
  children,
  updateObject,
  deleteObject = () => Promise.resolve(),
  saveObject = () => Promise.resolve(),
  alternativeIdCol,
  targetKey,
  context,
}: DataFetchProps<T>): React.ReactElement | null {
  // States
  const [form] = Form.useForm<T>();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [locked, setLocked] = useState<boolean>(false);

  // Store id in ref to avoid unnecessary effect triggers
  const idRef = useRef(id);
  useEffect(() => {
    idRef.current = id;
  }, [id]);

  // Memoized fetch handler with stable reference
  const fetchAndSetData = useCallback(() => {
    if (!idRef.current) return;

    let isMounted = true;
    fetchObject(idRef.current)
      .then((newData: T | undefined) => {
        if (newData && isMounted) {
          setData(newData);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err);
      });

    return () => {
      isMounted = false;
    };
  }, [fetchObject]); // Removed id dependency

  // Effect with cleanup
  useEffect(() => {
    const cleanup = ListenToEvent(id, fetchAndSetData);
    return () => {
      cleanup();
    };
  }, [id, fetchAndSetData]);

  // Memoize form validation function
  const validateAndGetValues = useCallback(async () => {
    return form.validateFields();
  }, [form]);

  // Memoized update handler with optimized dependencies
  const handleUpdateObject = useCallback(async () => {
    try {
      const values = await validateAndGetValues();
      const updatedValues = {
        ...data,
        ...values,
        [alternativeIdCol || "id"]: id,
      } as T;

      await updateObject(id, updatedValues);
      setData(updatedValues);
    } catch (err) {
      setError(err as Error);
    }
  }, [data, id, alternativeIdCol, updateObject, validateAndGetValues]);

  // Memoized delete handler with stable error handling
  const handleDeleteObject = useCallback(() => {
    if (!data) return;

    const deleteId = alternativeIdCol
      ? (data[alternativeIdCol as keyof T] as string)
      : data.id;

    if (!deleteId) {
      setError(
        new Error(`No ID found in data: ${JSON.stringify(data, null, 2)}`)
      );
      return;
    }

    deleteObject(deleteId).catch((e) => {
      setError(e);
      console.error("Error deleting object:", e);
    });
  }, [data, alternativeIdCol, deleteObject]);

  // Memoized context value with stable reference
  const contextValue = useMemo(
    () => ({
      data,
      error,
      form,
      isLoading,
      handleDeleteObject,
      handleUpdateObject,
      locked,
      setLocked,
      saveObject,
    }),
    [
      data,
      error,
      form,
      isLoading,
      handleDeleteObject,
      handleUpdateObject,
      locked,
      saveObject,
    ]
  );

  if (!data) {
    return null;
  }

  return (
    <NotificationProvider>
      <Reveal targetKey={`${targetKey}_${id}`}>
        <context.Provider value={contextValue as ChildProps<T>}>
          {children}
        </context.Provider>
      </Reveal>
    </NotificationProvider>
  );
}
