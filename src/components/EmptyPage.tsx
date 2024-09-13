import {Button, theme} from 'antd';
import {PlusOutlined} from "@ant-design/icons";
import useAppStore from "../stores/stylestore.ts";

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
        <div className={"flex flex-col gap-5 py-5"}
             style={{
                 textAlign: 'center',
                 background: darkMode ? token.colorBgContainer : token.colorBgLayout,
                 borderRadius: token.borderRadiusLG,
             }}
        >
            <Button className={"w-auto mx-auto"}
                    type="default"
                    icon={<PlusOutlined/>}
                    size="middle"
                    onClick={handleCreate}
            >
                Create a {type}
            </Button>
        </div>
    )
};
