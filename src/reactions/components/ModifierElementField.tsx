import {Col, Form, FormListFieldData, FormListOperation, Row, Select, SelectProps} from "antd";
import {CloseOutlined} from "@ant-design/icons";

interface ModifierElementFieldProps {
    field: FormListFieldData;
    subOpt: FormListOperation;
    availableSpecies: SelectProps["options"];
    handleUpdateObject: () => void;
}

export default function ModifierElementField(
    {
        field,
        subOpt,
        availableSpecies,
        handleUpdateObject,
    }: ModifierElementFieldProps) {
    return (
        <Row gutter={16} align="middle">
            <Col span={22}>
                <Form.Item
                    name={[field.name]}
                    style={{marginBottom: 0}}
                >
                    <Select
                        options={availableSpecies}
                        placeholder="Species"
                        onChange={handleUpdateObject}
                        style={{width: '100%'}}
                    />
                </Form.Item>
            </Col>
            <Col span={1} style={{textAlign: 'left'}}>
                <CloseOutlined
                    onClick={() => {
                        subOpt.remove(field.name);
                    }}
                    style={{cursor: 'pointer'}}
                />
            </Col>
        </Row>
    );
}