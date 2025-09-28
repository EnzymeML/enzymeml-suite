import { Button, theme } from 'antd';
import { PlusOutlined } from "@ant-design/icons";

import useAppStore from "@stores/appstore.ts";
import Reveal from "@animations/Reveal.tsx";

import NotificationProvider from "@components/NotificationProvider.tsx";

export default function EmptyPage(
    {
        type,
        handleCreate,
    }: {
        type: string,
        handleCreate: () => Promise<string>,
    }
) {
    // States
    const darkMode = useAppStore(state => state.darkMode);

    // Actions
    const setSelectedId = useAppStore(state => state.setSelectedId);

    // Styling
    const { token } = theme.useToken();

    // Handlers
    const onCreate = () => {
        handleCreate().then(
            (id) => {
                setSelectedId(id);
                console.log("Created from EmptyPage. Setted selectedId to: ", id)
            }
        ).catch(
            (error) => {
                console.error('Error:', error);
            }
        )
    }

    return (
        <NotificationProvider>
            <Reveal targetKey={`empty_${type.toLowerCase()}`} useTranslate={false}>
                <div className={"flex flex-col gap-5 py-5 mx-2 mb-2 shadow-sm"}
                    style={{
                        textAlign: 'center',
                        background: darkMode ? token.colorBgContainer : token.colorBgBase,
                        borderRadius: token.borderRadiusLG,
                        borderBottom: 1,
                        borderStyle: 'solid',
                        borderColor: darkMode ? token.colorBgContainer : token.colorBorder,
                    }}
                >
                    <Button className={"mx-auto w-auto shadow-sm"}
                        type="default"
                        icon={<PlusOutlined />}
                        size="middle"
                        onClick={onCreate}
                    >
                        Create {type}
                    </Button>
                </div>
            </Reveal>
        </NotificationProvider>
    )
};
