import React, {useEffect, useState} from "react";
import DataProvider from "../components/DataProvider.tsx";
import {ChildProps} from "../types.ts";
import {ListenToEvent, setCollectionIds} from "../tauri/listener.ts";
import useAppStore from "../stores/appstore.ts";
import {deleteEquation} from "../commands/equations.ts";
import {Empty, Layout, theme, Typography} from "antd";
import {Content} from "antd/es/layout/layout";
import {AnimatePresence} from "framer-motion";
import {getParameter, listAllParametersIds, updateParameter} from "../commands/parameters.ts";
import {Parameter} from "enzymeml/src";
import ParameterForm from "./ParameterForm.tsx";

// @ts-ignore
const ParameterContext = React.createContext<ChildProps<Parameter>>({})

export default function Parameters() {

    // States
    const [parameters, setParameters] = useState<[string, string][]>([]);
    const darkMode = useAppStore(state => state.darkMode);

    // Styling
    const {token} = theme.useToken();

    // State handlers
    const setState = () => {
        setCollectionIds(listAllParametersIds, setParameters);
    };

    // Fetch items on mount
    useEffect(() => setState(), []);
    useEffect(() => ListenToEvent("update_parameters", setState), []);

    // Create the items for the Collapsible component
    const parameterItems = parameters.map(([id]) => {
        return (
            <DataProvider<Parameter>
                key={`parameter_${id}`}
                targetKey={`parameter_${id}`}
                id={id}
                fetchObject={getParameter}
                updateObject={updateParameter}
                deleteObject={deleteEquation}
                alternativeIdCol={"species_id"}
                context={ParameterContext}
            >
                <div id={id} className={"flex flex-col justify-center"}>
                    <ParameterForm context={ParameterContext}/>
                </div>
            </DataProvider>
        );
    });

    if (parameters.length === 0) {
        return (
            <Empty/>
        );
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
                    <Typography.Title level={4}>Parameters</Typography.Title>
                    <AnimatePresence>
                        <div className={"pt-4"}>
                            {parameterItems.map((element) => element)}
                        </div>
                    </AnimatePresence>
                </div>
            </Content>
        </Layout>
    );
}