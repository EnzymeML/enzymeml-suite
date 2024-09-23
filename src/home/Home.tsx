import React, {useEffect, useState} from 'react';
import {listen} from '@tauri-apps/api/event'
import {allExpanded, defaultStyles, JsonView} from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import {
    DBEntries,
    EnzymeMLState,
    exportToJSON,
    getState,
    listEntries,
    newEntry,
    saveEntry
} from "../commands/dataio.ts";
import {Button, Input, Select} from "antd";
import {setTitle} from "../commands/enzmldoc.ts";

export default function Home() {

    // States
    const [currentDoc, setCurrentDoc] = useState<EnzymeMLState | null>(null);
    const [documents, setDocuments] = useState<DBEntries[]>()

    // Effects
    useEffect(() => {
        getState().then(
            (state) => {
                setCurrentDoc(state);
            })
            .catch((error) => {
                console.error('Error:', error);
            });

        listEntries().then(
            (data) => {
                setDocuments(data);
            }
        ).catch(
            (error) => {
                console.error('Error:', error);
            }
        )

    }, []);

    useEffect(() => {
        const unlisten = listen('update_document', () => {
            getState().then(
                (state) => {
                    setCurrentDoc(state);
                })
                .catch((error) => {
                    console.error('Error:', error);
                });

            listEntries().then(
                (data) => {
                    setDocuments(data);
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

    // Handlers
    const handleSaveEntry = () => {
        saveEntry()
            .then(() => {
                console.log('Entry saved');
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    const handleNewEntry = () => {
        newEntry().catch(
            (error) => {
                console.log("Error creating new entry: ", error);
            }
        )
    }

    const handleDownload = () => {
        exportToJSON().catch(
            (error) => {
                console.log('Error upon download: ', error);
            }
        )
    }

    return (
        <div>
            <div style={
                {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }
            }>
                <Input
                    className="text-2xl font-bold"
                    value={currentDoc?.title || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                />
                <div className={"flex flex-row gap-2"}>
                    <Button onClick={handleSaveEntry}>Save Entry</Button>
                    <Button onClick={handleNewEntry}>New Entry</Button>
                    <Button onClick={handleDownload}>Download</Button>
                    <Select placeholder={"Select a document"}
                            options={
                                documents?.map(
                                    ([id, title]) => (
                                        {
                                            label: id,
                                            value: title
                                        }
                                    )
                                )
                            }/>
                </div>
                <JsonView data={currentDoc?.doc}
                          shouldExpandNode={allExpanded}
                          style={defaultStyles}/>
            </div>
        </div>
    );
}