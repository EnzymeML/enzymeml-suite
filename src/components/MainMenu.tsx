import { Menu, theme } from "antd";
import Icon from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import useAppStore from "@stores/appstore.ts";
import SmallMoleculeIcon from "@icons/smallmolecule.svg";
import ProteinIcon from "@icons/protein.svg";
import ReactionsIcon from "@icons/reactions1.svg";
import MeasurementIcon from "@icons/measurements.svg";
import ModelsIcon from "@icons/models.svg";
import VesselsIcon from "@icons/vessels.svg";
import HomeIcon from "@icons/home.svg";

// Metadata
const ICON_SIZE = 20;

const items = [
  {
    key: "0",
    // @ts-expect-error - icon is not typed
    icon: <Icon style={{ fontSize: ICON_SIZE }} component={HomeIcon} />,
    label: "Overview",
    route: "/",
  },
  {
    key: "2",
    // @ts-expect-error - icon is not typed
    icon: <Icon style={{ fontSize: ICON_SIZE }} component={VesselsIcon} />,
    label: "Vessels",
    route: "/vessels",
  },
  {
    key: "3",
    icon: (
      <Icon
        style={{ fontSize: ICON_SIZE }}
        component={SmallMoleculeIcon as unknown as React.ComponentType}
      />
    ),
    label: "Small Molecules",
    route: "/small-molecules",
  },
  {
    key: "4",
    // @ts-expect-error - icon is not typed
    icon: <Icon style={{ fontSize: ICON_SIZE }} component={ProteinIcon} />,
    label: "Proteins",
    route: "/proteins",
  },
  {
    key: "5",
    // @ts-expect-error - icon is not typed
    icon: <Icon style={{ fontSize: ICON_SIZE }} component={ReactionsIcon} />,
    label: "Reactions",
    route: "/reactions",
  },
  {
    key: "6",
    // @ts-expect-error - icon is not typed
    icon: <Icon style={{ fontSize: ICON_SIZE }} component={MeasurementIcon} />,
    label: "Measurements",
    route: "/measurements",
  },
  {
    key: "7",
    // @ts-expect-error - icon is not typed
    icon: <Icon style={{ fontSize: ICON_SIZE }} component={ModelsIcon} />,
    label: "Modelling",
    route: "/modelling",
  },
];

export default function MainMenu() {
  // States
  const darkMode = useAppStore((state) => state.darkMode);

  // Styling
  const { token } = theme.useToken();

  // Handlers
  const navigate = useNavigate();
  const handleMenuClick = (e: { key: string }) => {
    const clickedItem = items.find((item) => item.key === e.key);
    if (clickedItem) {
      navigate(clickedItem.route);
    }
  };

  return (
    <Menu
      className={"py-2 h-auto shadow-sm"}
      style={{
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        border: 0,
        borderBottomLeftRadius: token.borderRadiusLG,
        borderBottomRightRadius: token.borderRadiusLG,
        borderBottom: 1,
        borderStyle: "solid",
        borderColor: darkMode ? token.colorBgContainer : token.colorBorder,
      }}
      theme={darkMode ? "dark" : "light"}
      mode="vertical"
      items={items}
      onClick={handleMenuClick}
    />
  );
}
