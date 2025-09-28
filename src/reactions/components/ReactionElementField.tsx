import {
    Col,
    Form,
    FormListFieldData,
    FormListOperation,
    InputNumber,
    Row,
    Select,
    SelectProps,
    Space,
} from "antd";
import { CloseOutlined } from "@ant-design/icons";

interface ReactionElementFieldProps {
    field: FormListFieldData;
    subOpt: FormListOperation;
    availableSpecies: SelectProps["options"];
    handleUpdateObject: () => void;
}

export default function ReactionElementField(
    {
        field,
        subOpt,
        availableSpecies,
        handleUpdateObject,
    }: ReactionElementFieldProps) {
    return (
        <Row align={"middle"}>
            <Col span={22}>
                <Row gutter={0} align="middle">
                    <Space.Compact style={{ width: "100%" }}>
                        <Col span={3}>
                            <Form.Item
                                name={[field.name, 'stoichiometry']}
                                style={{ marginBottom: 0 }}
                            >
                                <InputNumber placeholder={"Stoichiometry"}
                                    onChange={handleUpdateObject}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={21}>
                            <Form.Item
                                name={[field.name, 'species_id']}
                                style={{ marginBottom: 0 }}
                            >
                                <Select
                                    options={availableSpecies}
                                    placeholder="Species"
                                    onChange={handleUpdateObject}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Space.Compact>
                </Row>
            </Col>
            <Col span={2} style={{ textAlign: 'center' }}>
                <CloseOutlined
                    onClick={() => {
                        subOpt.remove(field.name);
                    }}
                    style={{ cursor: 'pointer' }}
                />
            </Col>
        </Row>
    );
}