import {Badge, List, theme, Typography} from "antd";
import useAppStore, {AvailablePaths} from "../stores/appstore.ts";
import {listSmallMolecules} from "../commands/smallmols.ts";
import {listVessels} from "../commands/vessels.ts";
import {listProteins} from "../commands/proteins.ts";
import {useEffect, useRef, useState} from "react";
import {listen} from "@tauri-apps/api/event";
import {useLocation} from "react-router-dom";

interface Collection {
    fetchFun: () => Promise<[string, string][]>;
}

const pathMapping: { [key in AvailablePaths]: Collection } = {
    [AvailablePaths.SMALL_MOLECULES]: {
        fetchFun: listSmallMolecules
    },
    [AvailablePaths.VESSELS]: {
        fetchFun: listVessels
    },
    [AvailablePaths.PROTEINS]: {
        fetchFun: listProteins
    },
    [AvailablePaths.REACTIONS]: {
        fetchFun: () => Promise.resolve([])
    }
};

const fetchCollectionNames = async (path: AvailablePaths) => {
    if (!pathMapping[path]) {
        return;
    }

    return pathMapping[path].fetchFun();
}

function CollectionItem({name, id}: { name: string, id: string }) {

    // Actions
    const setSelectedId = useAppStore(state => state.setSelectedId);

    const onClick = () => {
        const element = document.getElementById(id);

        if (element) {
            setSelectedId(id);
            element.scrollIntoView({behavior: "smooth", block: "nearest"});
        }
    }

    return (
        <List.Item className={"cursor-pointer w-full"}
                   onClick={onClick}>
            <div className={"flex flex-row items-center gap-2"}>
                <Badge count={id}
                       size={"small"}
                       color={"lime"}
                />
                <Typography.Text color={"accentColor"}
                >
                    {name}
                </Typography.Text>
            </div>
        </List.Item>
    )
}

export default function CollectionNav() {

    // States
    const darkMode = useAppStore(state => state.darkMode);
    const [collectionNames, setCollectionNames] = useState<[string, string][]>([])
    const path = useLocation().pathname;

    // References
    const pathRef = useRef(path);

    // Styles
    const {token} = theme.useToken();

    // Effects
    useEffect(() => {
        pathRef.current = path;
    }, [path]);

    useEffect(() => {
        fetchCollectionNames(path as AvailablePaths).then(
            (data) => {
                if (!(data === undefined)) {
                    setCollectionNames(data);
                }
            }
        )
    }, [path]);

    useEffect(() => {
        const unlisten = listen('update_nav', () => {
            fetchCollectionNames(pathRef.current as AvailablePaths).then(
                (data) => {
                    if (!(data === undefined)) {
                        setCollectionNames(data);
                    }
                }
            )
        });

        // Clean up the event listener on component unmount
        return () => {
            unlisten.then((fn) => fn());
        };
    }, []);

    return (
        <List className={"h-auto py-2 shadow-sm"}
              style={{
                  background: token.colorBgContainer,
                  borderRadius: token.borderRadiusLG,
                  border: 0,
                  borderBottomLeftRadius: token.borderRadiusLG,
                  borderBottomRightRadius: token.borderRadiusLG,
                  borderBottom: 1,
                  borderStyle: 'solid',
                  borderColor: darkMode ? token.colorBgContainer : token.colorBorder,
              }}
              size={"small"}
              dataSource={collectionNames}
              renderItem={(item) => <CollectionItem name={item[1]} id={item[0]}/>}
        />
    )
}