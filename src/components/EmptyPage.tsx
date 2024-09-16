import {Button, theme} from 'antd';
import {PlusOutlined} from "@ant-design/icons";
import useAppStore from "../stores/appstore.ts";
import Reveal from "../animations/Reveal.tsx";
import NotificationProvider from "./NotificationProvider.tsx";

export default function EmptyPage(
    {
        type,
        handleCreate,
    }: {
        type: string,
        handleCreate: () => void,
    }
) {
    // States
    const darkMode = useAppStore(state => state.darkMode);

    // Styling
    const {token} = theme.useToken();

    return (
        <NotificationProvider>
            <Reveal targetKey={`empty_${type.toLowerCase()}`} useTranslate={false}>
                <div className={"flex flex-col gap-5 py-5 shadow-sm mx-2 mb-2"}
                     style={{
                         textAlign: 'center',
                         background: darkMode ? token.colorBgContainer : token.colorBgBase,
                         borderRadius: token.borderRadiusLG,
                         borderBottom: 1,
                         borderStyle: 'solid',
                         borderColor: darkMode ? token.colorBgContainer : token.colorBorder,
                     }}
                >
                    <Button className={"w-auto mx-auto shadow-sm"}
                            type="default"
                            icon={<PlusOutlined/>}
                            size="middle"
                            onClick={handleCreate}
                    >
                        Create {type}
                    </Button>
                </div>
            </Reveal>
        </NotificationProvider>
    )
};
