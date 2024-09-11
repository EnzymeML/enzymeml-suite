import 'react-json-view-lite/dist/index.css';
import {useEffect, useState} from "react";
import {listen} from "@tauri-apps/api/event";
import DataHandle from "../components/datafetch.tsx";
import {ChildProps} from "../types.ts";
import {Reaction} from "../../../enzymeml-ts/src";
import {Button} from "antd";
import {createReaction, deleteReaction, getReaction, listReactions, updateReaction} from "../commands/reactions.ts";
import ReactionDetail from "./components/reactiondetail.tsx";

export default function Reactions() {

    // States
    const [reactions, setReactions] = useState<[string, string][] | null>(null);

    // Fetch small molecules on load
    useEffect(() => {
        // Fetch small molecule IDs
        listReactions().then(
            (data) => {
                setReactions(data);
            }
        ).catch(
            (error) => {
                console.error('Error:', error);
            }
        )
    }, []);

    // Re-fetch proteins on update
    useEffect(() => {
        const unlisten = listen('update_reactions', () => {
            listReactions().then(
                (data) => {
                    setReactions(data);
                }
            ).catch(
                (error) => {
                    console.error('Error:', error);
                }
            )
        });

        // Clean up the event listener on component unmount
        return () => {
            unlisten.then((fn) => fn());
        };
    }, []);

    const handleCreateReaction = () => {
        createReaction().then(
            () => {
                console.log('Reaction created');
            }
        )
    }

    return (
        <div className={"max-h-screen overflow-scroll scrollbar-hide"}>
            <div className={"flex flex-col gap-10"}>
                <Button onClick={handleCreateReaction}>Create Reaction</Button>
                {
                    reactions?.map(([id]) => {
                        return (
                            <DataHandle<Reaction>
                                key={`reaction_fetcher_${id}`}
                                id={id}
                                fetchObject={getReaction}
                                updateObject={updateReaction}
                                deleteObject={deleteReaction}
                            >
                                {(props: ChildProps<Reaction>) => (<ReactionDetail {...props} key={`reaction_${id}`}/>)}
                            </DataHandle>
                        );
                    })
                }
            </div>
        </div>
    );
}