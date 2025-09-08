import React from "react";
import { Layout, theme } from "antd";
import { Content } from "antd/lib/layout/layout";
import { ChildProps, Identifiable } from "../types.ts";
import useAppStore from "../stores/appstore.ts";
import DetailHeader from "./DetailHeader.tsx";
import { handleDelete } from "../tauri/listener.ts";

interface DetailViewProps<T extends Identifiable> {
  placeholder: string;
  context: React.Context<ChildProps<T>>;
  nameKey: keyof T;
  FormComponent: React.ComponentType<{ context: React.Context<ChildProps<T>> }>;
  listOfIds: [string, string][];
}

export default function DetailView<T extends Identifiable>({
  placeholder,
  context,
  nameKey,
  FormComponent,
  listOfIds,
}: DetailViewProps<T>): React.ReactElement {
  // Hooks
  const { token } = theme.useToken();

  // Context
  const props = React.useContext(context);

  // States
  const darkMode = useAppStore((state) => state.darkMode);
  const selectedId = useAppStore((state) => state.selectedId);
  const setSelectedId = useAppStore((state) => state.setSelectedId);

  // Memoize ID computation
  const id = React.useMemo(() => {
    if (!props) return null;
    if ("id" in props.data && props.data.id) {
      return props.data.id;
    }
    if (props.alternativeIdCol && props.alternativeIdCol in props.data) {
      // @ts-ignore
      return props.data[props.alternativeIdCol];
    }
    return null;
  }, [props]);

  // Memoize delete handler
  const handleDeleteObject = React.useCallback(() => {
    if (id) {
      handleDelete(
        id,
        selectedId,
        setSelectedId,
        listOfIds,
        props?.handleDeleteObject
      );
    }
  }, [id, selectedId, setSelectedId, listOfIds, props?.handleDeleteObject]);

  // Extract static styles
  const containerStyle = React.useMemo(
    () => ({
      padding: 24,
      background: token.colorBgContainer,
      borderRadius: token.borderRadiusLG,
      borderBottom: 1,
      borderStyle: "solid",
      borderColor: darkMode ? token.colorBgContainer : token.colorBorder,
      color: token.colorText,
    }),
    [token, darkMode]
  );

  if (!props) {
    return <h1>No context given. Please contact support.</h1>;
  }

  if (!id) {
    return <h1>No ID available. Please contact support</h1>;
  }

  return (
    <Layout className={"flex overflow-auto flex-col"}>
      <Content>
        <div className={"mb-2 shadow-sm"} style={containerStyle}>
          <div className="flex flex-col gap-2">
            <DetailHeader
              id={id}
              speciesName={props.data[nameKey]}
              placeholder={placeholder}
              handleDeleteObject={handleDeleteObject}
              setLocked={props.setLocked}
              saveObject={props.saveObject}
            />
            {selectedId === id && (
              <div
                className={"flex flex-col"}
                key={id}
                style={{ overflow: "hidden" }}
              >
                <FormComponent context={context} />
              </div>
            )}
          </div>
        </div>
      </Content>
    </Layout>
  );
}
