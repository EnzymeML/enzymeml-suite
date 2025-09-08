import { Badge, Col, List, Row, theme, Typography } from "antd";
import useAppStore, { AvailablePaths } from "../stores/appstore.ts";
import { listSmallMolecules } from "../commands/smallmols.ts";
import { listVessels } from "../commands/vessels.ts";
import { listProteins } from "../commands/proteins.ts";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getBadgeColor } from "./CardHeader.tsx";
import { listReactions } from "../commands/reactions.ts";
import { listMeasurements } from "../commands/measurements.ts";

interface Collection {
  fetchFun: () => Promise<[string, string][]>;
}

// @ts-ignore
const pathMapping: { [key in AvailablePaths]: Collection } = {
  [AvailablePaths.SMALL_MOLECULES]: {
    fetchFun: listSmallMolecules,
  },
  [AvailablePaths.VESSELS]: {
    fetchFun: listVessels,
  },
  [AvailablePaths.PROTEINS]: {
    fetchFun: listProteins,
  },
  [AvailablePaths.REACTIONS]: {
    fetchFun: listReactions,
  },
  [AvailablePaths.MEASUREMENTS]: {
    fetchFun: listMeasurements,
  },
  [AvailablePaths.MODELS]: {
    fetchFun: async () => [],
  },
};

const fetchCollectionNames = async (path: AvailablePaths) => {
  if (!pathMapping[path]) {
    return;
  }

  return pathMapping[path].fetchFun();
};

const truncateName = (name: string) => {
  return name.length > 20 ? name.slice(0, 20) + " ..." : name;
};

function CollectionItem({ name, id }: { name: string; id: string }) {
  // States
  const [hovered, setHovered] = useState<boolean>(false);

  // Actions
  const setSelectedId = useAppStore((state) => state.setSelectedId);
  const darkMode = useAppStore((state) => state.darkMode);

  // Style
  const { token } = theme.useToken();

  const onClick = () => {
    setSelectedId(id);
  };

  let style = { color: token.colorTextSecondary };

  if (name.length === 0) {
    name = "Unnamed";
    style = { color: token.colorTextDisabled };
  }

  return (
    <List.Item className={"cursor-pointer w-full"} onClick={onClick}>
      <Row align={"top"} gutter={16} className={"w-full"}>
        <Col span={5}>
          <Badge count={id} size={"small"} color={getBadgeColor(darkMode)} />
        </Col>
        <Col
          span={18}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <Typography.Text style={style} color={"accentColor"}>
            {hovered ? name : truncateName(name)}
          </Typography.Text>
        </Col>
      </Row>
    </List.Item>
  );
}

export default function CollectionNav() {
  // States
  const darkMode = useAppStore((state) => state.darkMode);
  const [collectionNames, setCollectionNames] = useState<[string, string][]>(
    []
  );
  const path = useLocation().pathname;

  // References
  const pathRef = useRef(path);

  // Styles
  const { token } = theme.useToken();

  // Effects
  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  useEffect(() => {
    fetchCollectionNames(path as AvailablePaths).then((data) => {
      if (!(data === undefined)) {
        setCollectionNames(data);
      }
    });
  }, [path]);

  if (path === AvailablePaths.HOME) {
    return null;
  } else if (collectionNames.length === 0) {
    return null;
  }

  return (
    <div>
      <List
        className={
          "max-h-60 py-2 shadow-sm 2-full overflow-auto scrollbar-hide"
        }
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
        size={"small"}
        dataSource={collectionNames}
        renderItem={(item) => <CollectionItem name={item[1]} id={item[0]} />}
      />
    </div>
  );
}
