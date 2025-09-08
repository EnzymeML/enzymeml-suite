import { AutoComplete, Form, Input, Radio, Select } from "antd";
import { FormViewProps } from "../types.ts";
import { Protein } from "enzymeml";
import React, { ChangeEvent, useEffect, useState } from "react";
import { listVessels } from "../commands/vessels.ts";
import { AutoCompleteProps } from "antd/lib";
import { fetchFromUniProt, UniProtEntry } from "./fetchutils.ts";
import { RiExternalLinkLine } from "react-icons/ri";
import SpeciesReference from "../components/SpeciesReference.tsx";
import DBEntryRow from "../components/DBEntryRow.tsx";
import { Option } from "../types/options.ts";
import { extractHref } from "../smallmols/SmallMoleculeForm.tsx";
import useAppStore from "../stores/appstore.ts";
import FormBase from "../components/FormBase.tsx";

function check(value: string | number | undefined | null): string | null {
  if (value === undefined || value === null) {
    return null;
  } else {
    return String(value);
  }
}

export default function ProteinForm({ context }: FormViewProps<Protein>) {
  // States
  const [vesselOptions, setVesselOptions] = useState<Option[]>([]);
  const [uniprotOptions, setUniprotOptions] = useState<
    AutoCompleteProps["options"]
  >([]);
  const [unitProtResult, setUnitProtResult] = useState<UniProtEntry[]>();
  const databasesToUse = useAppStore((state) => state.databasesToUse);

  // Context
  const { handleUpdateObject, form, data, locked } = React.useContext(context);

  // Memoize handlers
  const handlePreUpdateObject = React.useCallback(() => {
    const references = form.getFieldValue("references");
    if (typeof references === "string") {
      form.setFieldsValue({ references: [references] });
    }
    handleUpdateObject();
  }, [form, handleUpdateObject]);

  const processEntry = React.useCallback(
    (entry: UniProtEntry) => {
      const formData = {
        name: entry.proteinDescription.recommendedName.fullName.value,
        sequence: check(entry.sequence.value),
        organism: check(entry.organism.scientificName),
        organism_tax_id: check(entry.organism.taxonId),
        references: [
          `https://www.uniprot.org/uniprot/${entry.primaryAccession}`,
        ],
        ecnumber:
          entry.proteinDescription.recommendedName.ecNumbers?.[0]?.value ??
          null,
      };

      form.setFieldsValue(formData);
      handleUpdateObject();

      setUniprotOptions([]);
      setUnitProtResult([]);
    },
    [form, handleUpdateObject]
  );

  const onSearch = React.useCallback(
    (searchText: string) => {
      if (!databasesToUse.includes("uniprot")) return;

      fetchFromUniProt(searchText, 15).then((res) => {
        if (!res) return;

        const options = res.map((item) => ({
          value: item.primaryAccession,
          label: (
            <DBEntryRow
              value={item.proteinDescription.recommendedName.fullName.value}
              database={"UniProt"}
              baseUri={"https://www.uniprot.org/uniprotkb/"}
              id={item.primaryAccession}
            />
          ),
        }));

        setUniprotOptions(options);
        setUnitProtResult(res);
      });
    },
    [databasesToUse]
  );

  const onEcNumberSearch = React.useCallback(
    (searchText: string) => {
      onSearch(`ec:${searchText} *`);
    },
    [onSearch]
  );

  const onSelect = React.useCallback(
    (uniprotId: string) => {
      const entry = unitProtResult?.find(
        (item) => item.primaryAccession === uniprotId
      );
      if (entry) {
        processEntry(entry);
      }
    },
    [unitProtResult, processEntry]
  );

  const onSetReference = React.useCallback(
    (uniprotURI: string) => {
      let uniprotId;
      if (uniprotURI.startsWith("https://www.uniprot.org")) {
        const url = new URL(uniprotURI);
        const pathParts = url.pathname.split("/");
        uniprotId = pathParts[2];
      }

      if (!uniprotId) return;

      fetchFromUniProt(uniprotId, 1).then((res) => {
        if (res?.[0]) {
          processEntry(res[0]);
        }
      });
    },
    [processEntry]
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

  // Memoize the reference label
  const referenceLabel = React.useMemo(() => {
    const href = extractHref(form.getFieldValue("references"));
    return href ? (
      <a
        className={"flex flex-row gap-1 place-items-baseline"}
        href={href}
        target={"_blank"}
      >
        Reference
        <RiExternalLinkLine size={11} />
      </a>
    ) : (
      "Reference"
    );
  }, [form.getFieldValue("references")]);

  return (
    <FormBase
      form={form}
      data={data}
      handleUpdate={handlePreUpdateObject}
      locked={locked}
    >
      <Form.Item label="Name" name="name" rules={[{ required: true }]}>
        <AutoComplete
          className={"w-full"}
          options={uniprotOptions}
          onSearch={onSearch}
          onSelect={onSelect}
          onChange={handlePreUpdateObject}
        />
      </Form.Item>
      <Form.Item label="Vessel" name="vessel_id">
        <Select options={vesselOptions} />
      </Form.Item>
      <Form.Item label={"Constant"} name={"constant"}>
        <Radio.Group defaultValue={true} className={"flex flex-row w-full"}>
          <Radio.Button className={"flex-1"} value={true}>
            Constant
          </Radio.Button>
          <Radio.Button className={"flex-1"} value={false}>
            Not Constant
          </Radio.Button>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="Sequence" name="sequence">
        <Input.TextArea />
      </Form.Item>
      <Form.Item
        label="EC Number"
        name="ecnumber"
        rules={[
          {
            pattern: new RegExp("^\\d+\\.\\d+\\.\\d+\\.\\d+$"),
            message: "Please enter a valid EC number",
          },
        ]}
      >
        <AutoComplete
          className={"w-full"}
          options={uniprotOptions}
          onSearch={onEcNumberSearch}
          onSelect={onSelect}
          onChange={handlePreUpdateObject}
        />
      </Form.Item>
      <Form.Item label="Organism" name="organism">
        <Input />
      </Form.Item>
      <Form.Item label="Taxonomy ID" name="organism_tax_id">
        <Input />
      </Form.Item>
      <Form.Item label={referenceLabel} name="references">
        <Input
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onSetReference(e.target.value)
          }
        />
      </Form.Item>
    </FormBase>
  );
}
