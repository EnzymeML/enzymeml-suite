import React, { useEffect, useState } from "react";
import { AutoComplete, Col, Form, Input, Radio, Row, Select } from "antd";
import { RiExternalLinkLine } from "react-icons/ri";
import capitalize from "antd/lib/_util/capitalize";
import { AutoCompleteProps } from "antd/lib";
import { SmallMolecule } from "enzymeml";

import { Option } from "@suite-types/options";
import { listVessels } from "@commands/vessels";
import SpeciesReference from "@components/SpeciesReference";
import { ChildProps } from "@suite-types/types";
import useAppStore from "@stores/appstore";
import FormBase from "@components/FormBase";
import { filterSmallMolecules, getAllSmallMolecules, getSmallMoleculeById } from "@commands/dbops";
import { assembleOptions, DBOption } from "@utilities/dbutils";

import { fetchFromPubChem, fetchPubChemDetails } from "@smallmols/fetchutils";
import SmileDrawerContainer from "@smallmols/components/SmilesDrawerContainer";

/**
 * Gets the default internal options for small molecules from the database
 * 
 * Fetches all small molecules from the database and formats them as options
 * for use in an AutoComplete component, with "Internal" labels and pink tags
 * 
 * @returns {Promise<{label: JSX.Element, title: string, options: Array<{value: string|number, label: JSX.Element}>}>} 
 *          The formatted options object containing all internal small molecules
 */
async function getDefaultInternalOptions() {
  const allSmallMolecules = await getAllSmallMolecules();
  const allSmallMoleculesOptions = assembleOptions(allSmallMolecules, null, "pink", "Internal", "Internal");

  return allSmallMoleculesOptions;
}


export const extractHref = (value: string | string[] | undefined | null) => {
  let href;

  if (typeof value === "string") {
    href = value;
  } else if (Array.isArray(value)) {
    href = value[0];
  } else {
    return undefined;
  }

  // If the value is not a URL return undefined
  if (!href?.startsWith("http")) {
    return undefined;
  }

  return href;
};

export default React.memo(
  function SmallMoleculeForm({
    context,
  }: {
    context: React.Context<ChildProps<SmallMolecule>>;
  }) {
    // States
    const [vesselOptions, setVesselOptions] = useState<Option[]>([]);
    const [options, setOptions] = useState<
      AutoCompleteProps["options"]
    >([]);
    const databasesToUse = useAppStore((state) => state.databasesToUse);

    // Effect to fetch default internal options
    useEffect(() => {
      getDefaultInternalOptions().then((options) => setOptions([options]));
    }, []);

    // Context
    const { handleUpdateObject, form, data, locked } =
      React.useContext(context);

    // 2. Use form.getFieldValue directly in the memo dependency instead of useWatch
    const formReferences = form.getFieldValue("references");

    // 3. Add proper dependency array to useCallback
    const handlePreUpdateObject = React.useCallback(() => {
      const references = form.getFieldValue("references");
      if (typeof references === "string") {
        form.setFieldsValue({ references: [references] });
      }

      const name = form.getFieldValue("name");
      form.setFieldsValue({ name: capitalize(name) });

      handleUpdateObject();
    }, [form, handleUpdateObject]);

    const onSearch = React.useCallback(
      async (searchText: string) => {
        if (!databasesToUse.includes("pubchem")) {
          return;
        }

        let internalOptions: DBOption[];

        if (searchText.length == 0) {
          internalOptions = await getAllSmallMolecules()
            .then((res) => res.map(
              ({ id, name }) => ({ id, name }))
            );
        } else {
          internalOptions = await filterSmallMolecules(searchText)
            .then((res) => res.map(
              ({ id, name }) => ({ id, name }))
            );
        }

        const pubChemOptions = await fetchFromPubChem(searchText, 30)
          .then((res) => res.map(
            (id) => ({ id: id, name: id })
          ));


        // Convert to options
        const internalOptionsOptions = assembleOptions(internalOptions, null, "pink", "Internal", "Internal");
        const pubChemOptionsOptions = assembleOptions(
          pubChemOptions, "https://pubchem.ncbi.nlm.nih.gov/compound/", "blue", "PubChem", "PubChem"
        );

        setOptions([
          internalOptionsOptions,
          pubChemOptionsOptions,
        ]);
      },
      [databasesToUse]
    );

    const onSelect = React.useCallback(
      (name: string, option: DBOption) => {
        if (option.database === "PubChem") {
          fetchPubChemDetails(name, form).then(() => {
            handleUpdateObject();
          });
        } else {
          if (option.value) {
            getSmallMoleculeById(option.value).then((smallMolecule) => {
              form.setFieldsValue({
                name: smallMolecule.name,
                canonical_smiles: smallMolecule.canonical_smiles,
                inchikey: smallMolecule.inchikey,
                references: smallMolecule.references,
              });
              handleUpdateObject();
            });
          }
        }
      },
      [form, handleUpdateObject]
    );

    // Memoize vessel options effect
    useEffect(() => {
      let mounted = true;

      listVessels()
        .then((data) => {
          if (!mounted) return;

          const options = data.map(([id, name]) => ({
            label: <SpeciesReference name={name} id={id} />,
            value: id,
          }));
          setVesselOptions(options);
        })
        .catch((error) => {
          console.error("Error:", error);
        });

      return () => {
        mounted = false;
      };
    }, []);

    // Memoize the reference label with proper dependency
    const referenceLabel = React.useMemo(() => {
      const href = extractHref(formReferences);
      return href ? (
        <a
          className={"flex flex-row gap-1 place-items-baseline"}
          href={href}
          target={"_blank"}
          rel="noopener noreferrer"
        >
          Reference
          <RiExternalLinkLine size={11} />
        </a>
      ) : (
        "Reference"
      );
    }, [formReferences]);

    return (
      <FormBase
        form={form}
        data={data}
        handleUpdate={handlePreUpdateObject}
        locked={locked}
      >
        <Row gutter={16} align={"top"}>
          <Col span={17}>
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <AutoComplete
                className={"w-full"}
                //@ts-expect-error // TODO: fix this type error
                options={options}
                onSearch={onSearch}
                onSelect={onSelect}
                onChange={handlePreUpdateObject}
              />
            </Form.Item>
            <Form.Item label="Vessel" name="vessel_id">
              <Select options={vesselOptions} />
            </Form.Item>
            <Form.Item label={"Constant"} name={"constant"}>
              <Radio.Group
                defaultValue={true}
                className={"flex flex-row w-full"}
              >
                <Radio.Button className={"flex-1"} value={true}>
                  Constant
                </Radio.Button>
                <Radio.Button className={"flex-1"} value={false}>
                  Not Constant
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="SMILES" name="canonical_smiles">
              <Input.TextArea />
            </Form.Item>
            <Form.Item label="InChIKey" name="inchikey">
              <Input.TextArea />
            </Form.Item>
            <Form.Item label={referenceLabel} name="references">
              <Input />
            </Form.Item>
          </Col>
          <Col span={5}>
            <SmileDrawerContainer
              smilesStr={form.getFieldValue("canonical_smiles")}
            />
          </Col>
        </Row>
      </FormBase>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.context === nextProps.context;
  }
);


