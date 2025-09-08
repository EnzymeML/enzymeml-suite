import { Col, Form, FormListFieldData, FormListOperation, Row, Select, SelectProps, Space } from "antd";
import { ModifierRole } from "enzymeml";
import { CloseOutlined } from "@ant-design/icons";

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

    const availableRoles = Object.values(ModifierRole).map((role) => ({
        value: role,
        label: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(),
    }));

    return (
        <Row gutter={16} align="middle">
            <Col span={22}>
                <Row gutter={0} align="middle">
                    <Space.Compact style={{ width: "100%" }}>
                        <Col span={16}>
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
                        <Col span={8}>
                            <Form.Item
                                name={[field.name, 'role']}
                                style={{ marginBottom: 0 }}
                            >
                                <Select
                                    options={availableRoles}
                                    placeholder="Role"
                                    onChange={handleUpdateObject}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Space.Compact>
                </Row>
            </Col>
            <Col span={1} style={{ textAlign: 'left' }}>
                <CloseOutlined
                    onClick={() => {
                        subOpt.remove(field.name);
                    }}
                    style={{ cursor: 'pointer' }}
                />
            </Col>
        </Row >
    );
}