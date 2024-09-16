import {Menu, theme} from "antd";
import useAppStore from "../stores/appstore.ts";
import {useNavigate} from "react-router-dom";
import SmallMoleculeIcon from "../icons/smallmolecule.svg";
import ProteinIcon from "../icons/protein.svg";
import ReactionsIcon from "../icons/reactions1.svg";
import MeasurementIcon from "../icons/measurements.svg";
import ModelsIcon from "../icons/models.svg";
import VesselsIcon from "../icons/vessels.svg";
import HomeIcon from "../icons/home.svg";
import Icon from "@ant-design/icons";

// Metadata
const ICON_SIZE = 20;

// @ts-ignore
const items = [
    {
        key: '0',
        // @ts-ignore
        icon: <Icon style={{fontSize: ICON_SIZE}} component={HomeIcon}/>,
        label: 'Overview',
        route: '/',
    },
    {
        key: '2',
        // @ts-ignore
        icon: <Icon style={{fontSize: ICON_SIZE}} component={VesselsIcon}/>,
        label: 'Vessels',
        route: '/vessels',
    },
    {
        key: '3',
        // @ts-ignore
        icon: <Icon style={{fontSize: ICON_SIZE}} component={SmallMoleculeIcon}/>,
        label: 'Small Molecules',
        route: '/small-molecules',
    },
    {
        key: '4',
        // @ts-ignore
        icon: <Icon style={{fontSize: ICON_SIZE}} component={ProteinIcon}/>,
        label: 'Proteins',
        route: '/proteins',
    },
    {
        key: '5',
        // @ts-ignore
        icon: <Icon style={{fontSize: ICON_SIZE}} component={ReactionsIcon}/>,
        label: 'Reactions',
        route: '/reactions',
    },
    {
        key: '6',
        // @ts-ignore
        icon: <Icon style={{fontSize: ICON_SIZE}} component={MeasurementIcon}/>,
        label: 'Measurements',
        route: '/measurements',
    },
    {
        key: '7',
        // @ts-ignore
        icon: <Icon style={{fontSize: ICON_SIZE}} component={ModelsIcon}/>,
        label: 'Models',
        route: '/models',
    },
];

export default function MainMenu() {

    // States
    const darkMode = useAppStore(state => state.darkMode);

    // Styling
    const {token} = theme.useToken();

    // Handlers
    const navigate = useNavigate();
    const handleMenuClick = (e: any) => {
        const clickedItem = items.find(item => item.key === e.key);
        if (clickedItem) {
            navigate(clickedItem.route);
        }
    };

    return (
        <Menu className={"h-auto py-2 shadow-sm"}
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
              theme={darkMode ? "dark" : "light"}
              mode="vertical"
              items={items}
              onClick={handleMenuClick}
        />
    )
}