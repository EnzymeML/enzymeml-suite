import React, {useEffect, useState} from "react";
import DataProvider from "../components/DataProvider.tsx";
import {ChildProps} from "../types.ts";
import {Equation} from "../../../enzymeml-ts/src";
import EmptyPage from "../components/EmptyPage.tsx";
import {ListenToEvent, setCollectionIds} from "../tauri/listener.ts";
import useAppStore from "../stores/appstore.ts";
import {createEquation, deleteEquation, getEquation, listEquations, updateEquation} from "../commands/equations.ts";
import ModelForm from "./ModelForm.tsx";
import {Layout, theme, Typography} from "antd";
import {Content} from "antd/es/layout/layout";
import {AnimatePresence} from "framer-motion";

// @ts-ignore
const EquationContext = React.createContext<ChildProps<Equation>>({})

export default function Equations() {

    // States
    const [equations, setEquations] = useState<[string, string][]>([]);
    const darkMode = useAppStore(state => state.darkMode);

    // Styling
    const {token} = theme.useToken();

    // State handlers
    const setState = () => {
        setCollectionIds(listEquations, setEquations);
    };

    // Fetch items on mount
    useEffect(() => setState(), []);
    useEffect(() => ListenToEvent("update_equations", setState), []);

    // Create the items for the Collapsible component
    const equationItems = equations.map(([id]) => {
        return (
            <DataProvider<Equation>
                key={`equation_${id}`}
                targetKey={`equation_${id}`}
                id={id}
                fetchObject={getEquation}
                updateObject={updateEquation}
                deleteObject={deleteEquation}
                alternativeIdCol={"species_id"}
                context={EquationContext}
            >
                <div id={id} className={"flex flex-col justify-center"}>
                    <ModelForm context={EquationContext}/>
                </div>
            </DataProvider>
        );
    });

    if (equations.length === 0) {
        return (
            <EmptyPage type={"Reaction"} handleCreate={createEquation}/>
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
                    <Typography.Title level={4}>Equations</Typography.Title>
                    <AnimatePresence>
                        <div className={"pt-4"}>
                            {equationItems.map((element) => element)}
                        </div>
                    </AnimatePresence>
                </div>
            </Content>
        </Layout>
    );
}