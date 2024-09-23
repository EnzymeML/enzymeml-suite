import React from "react";
import {Layout, theme} from "antd";
import {Content} from "antd/lib/layout/layout";
import {AnimatePresence, motion} from "framer-motion";
import {ChildProps, Identifiable} from "../types.ts";
import useAppStore from "../stores/appstore.ts";
import DetailHeader from "./DetailHeader.tsx";
import {handleDelete} from "../tauri/listener.ts";

interface DetailViewProps<T extends Identifiable> {
    placeholder: string,
    context: React.Context<ChildProps<T>>,
    nameKey: string,
    FormComponent: React.ComponentType<{ context: React.Context<ChildProps<T>> }>
    listOfIds: [string, string][]
}

export default function DetailView<T extends Identifiable>(
    {
        placeholder,
        context,
        nameKey,
        FormComponent,
        listOfIds,
    }: DetailViewProps<T>
): React.ReactElement {

    // Hooks
    const {token} = theme.useToken();

    // Context
    const props = React.useContext(context)

    // States
    const darkMode = useAppStore(state => state.darkMode);
    const selectedId = useAppStore(state => state.selectedId);

    // Actions
    const setSelectedId = useAppStore(state => state.setSelectedId);

    if (!props) {
        return <h1>No context given. Please contact support.</h1>
    }

    let id: string

    if ("id" in props.data && props.data.id) {
        id = props.data.id
    } else if (props.alternativeIdCol && props.alternativeIdCol in props.data) {
        // @ts-ignore
        id = props.data[props.alternativeIdCol]
    } else {
        return <h1>No ID available. Please contact support</h1>
    }

    // Handlers
    const handleDeleteObject = () => {
        handleDelete(id, selectedId, setSelectedId, listOfIds, props.handleDeleteObject)
    }

    return (
        <Layout className={"flex flex-col overflow-auto"}>
            <Content>
                <div className={"shadow-sm mb-2"}
                     style={{
                         padding: 24,
                         background: token.colorBgContainer,
                         borderRadius: token.borderRadiusLG,
                         borderBottom: 1,
                         borderStyle: 'solid',
                         borderColor: darkMode ? token.colorBgContainer : token.colorBorder,
                         color: token.colorText,
                     }}>
                    <div className="flex flex-col gap-2">
                        <DetailHeader
                            id={id}
                            speciesName={props.data[nameKey]}
                            placeholder={placeholder}
                            handleDeleteObject={handleDeleteObject}
                            setLocked={props.setLocked}
                        />
                        <AnimatePresence initial={false}>
                            {selectedId === id && (
                                <motion.div
                                    className={"flex flex-col"}
                                    key={id}
                                    initial={{opacity: 0.0, height: 0, y: -30}}
                                    animate={{opacity: 1, height: 'auto', y: 0}}
                                    exit={{opacity: 0, height: 0, y: -30}}
                                    transition={{
                                        opacity: {duration: 0.0},
                                        height: {duration: 0.20},
                                        y: {duration: 0.20, ease: 'easeInOut'}
                                    }}
                                    style={{overflow: 'hidden'}} // to prevent content from overflowing while collapsing
                                >
                                    <FormComponent context={context}/>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </Content>
        </Layout>
    );
}