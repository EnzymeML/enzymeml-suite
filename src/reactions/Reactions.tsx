import React, { ComponentType, useCallback, useEffect, useState } from "react";
import DataProvider from "../components/DataProvider.tsx";
import { ChildProps } from "../types.ts";
import { Reaction } from "enzymeml";
import {
  createReaction,
  deleteReaction,
  getReaction,
  listReactions,
  updateReaction,
} from "../commands/reactions.ts";
import DetailView from "../components/DetailView.tsx";
import ReactionForm from "./ReactionForm.tsx";
import FloatingCreate from "../components/FloatingCreate.tsx";
import Collection from "../components/Collection.tsx";
import EmptyPage from "../components/EmptyPage.tsx";
import { setCollectionIds } from "../tauri/listener.ts";
import useAppStore from "../stores/appstore.ts";
import { useTauriListener } from "../hooks/useTauriListener.ts";

// @ts-ignore
const ReactionContext = React.createContext<ChildProps<Reaction>>({});

// Memoize the DetailView component to prevent unnecessary re-renders
const MemoizedDetailView = React.memo(DetailView);

// Create a memoized item component
const ReactionItem = React.memo(
  ({ id, reactions }: { id: string; reactions: [string, string][] }) => (
    <DataProvider<Reaction>
      key={`reaction_${id}`}
      targetKey={`reaction_${id}`}
      id={id}
      fetchObject={getReaction}
      updateObject={updateReaction}
      deleteObject={deleteReaction}
      context={ReactionContext}
    >
      <div id={id}>
        <MemoizedDetailView
          // @ts-ignore for now
          context={ReactionContext}
          placeholder={"Reaction"}
          nameKey={"name"}
          // @ts-ignore for now
          FormComponent={
            ReactionForm as ComponentType<{ context: typeof ReactionContext }>
          }
          listOfIds={reactions}
        />
      </div>
    </DataProvider>
  )
);

export default function Reactions() {
  // States
  const [reactions, setReactions] = useState<[string, string][]>([]);
  const selectedId = useAppStore((state) => state.selectedId);

  // State handlers
  const setState = useCallback(() => {
    setCollectionIds(listReactions, setReactions);
  }, []);

  // Fetch items on mount
  useEffect(() => setState(), [selectedId, setState]);
  useTauriListener("update_reactions", setState);

  // Create the items for the Collapsible component
  const items = React.useMemo(
    () =>
      reactions.map(([id]) => (
        <ReactionItem key={id} id={id} reactions={reactions} />
      )),
    [reactions]
  );

  if (reactions.length === 0) {
    return <EmptyPage type={"Reaction"} handleCreate={createReaction} />;
  }

  return (
    <div className={"flex flex-col"}>
      <FloatingCreate handleCreate={createReaction} type={"Reaction"} />
      <Collection
        items={items}
        handleCreateObject={createReaction}
        type={"Reaction"}
      />
    </div>
  );
}
