import React, {useCallback, useEffect, useState} from "react";
import DataProvider from "../components/DataProvider.tsx";
import {ChildProps} from "../types.ts";
import {Reaction} from "../../../enzymeml-ts/src";
import {createReaction, deleteReaction, getReaction, listReactions, updateReaction} from "../commands/reactions.ts";
import DetailView from "../components/DetailView.tsx";
import ReactionForm from "./ReactionForm.tsx";
import FloatingCreate from "../components/FloatingCreate.tsx";
import Collection from "../components/Collection.tsx";
import EmptyPage from "../components/EmptyPage.tsx";
import {ListenToEvent, setCollectionIds} from "../tauri/listener.ts";
import useAppStore from "../stores/appstore.ts";

// @ts-ignore
const ReactionContext = React.createContext<ChildProps<Reaction>>({})

export default function Reactions() {

    // States
    const [reactions, setReactions] = useState<[string, string][]>([]);
    const selectedId = useAppStore(state => state.selectedId);

    // State handlers
    const setState = useCallback(() => {
        setCollectionIds(listReactions, setReactions);
    }, [listReactions, setReactions]);

    // Fetch items on mount
    useEffect(() => setState(), [selectedId]);
    useEffect(() => ListenToEvent("update_reactions", setState), []);

    // Create the items for the Collapsible component
    const items = reactions.map(([id]) => {
        return (
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
                    <DetailView context={ReactionContext}
                                placeholder={"Reaction"}
                                nameKey={"name"}
                                FormComponent={ReactionForm}
                                listOfIds={reactions}
                    />
                </div>
            </DataProvider>
        );
    });

    if (reactions.length === 0) {
        return (
            <EmptyPage type={"Reaction"} handleCreate={createReaction}/>
        );
    }

    return (
        <div className={"flex flex-col"}>
            <FloatingCreate handleCreate={createReaction} type={"Reaction"}/>
            <Collection items={items} handleCreateObject={createReaction} type={"Reaction"}/>
        </div>
    );
}