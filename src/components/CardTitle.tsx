import Title from "antd/es/typography/Title"
import { Typography } from "antd"

const { Text } = Typography

export default function CardTitle({ title, description }: { title: string, description: string }) {
    return (
        <div className="px-2 pt-6">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div>
                        <Title level={4} style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                            {title}
                        </Title>
                        <Text type="secondary" style={{ fontSize: "12px", fontWeight: "400", whiteSpace: "normal", wordWrap: "break-word" }}>
                            {description}
                        </Text>
                    </div>
                </div>
            </div>
        </div>
    )
}