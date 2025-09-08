"use client"

import type React from "react"
import { useState } from "react"
import { Input, Button, Space } from "antd"
import { EditOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons"
import { motion, AnimatePresence } from "framer-motion"

interface EditableNumberCellProps {
    field: string
    value: number | undefined
    onSave: (value: number) => Promise<void>
    isEditing: boolean
    onStartEdit: () => void
    onCancelEdit: () => void
}

const EditableNumberCell: React.FC<EditableNumberCellProps> = ({
    value,
    onSave,
    isEditing,
    onStartEdit,
    onCancelEdit
}) => {
    const [editingValue, setEditingValue] = useState<string>("")

    const handleStartEdit = () => {
        setEditingValue(value?.toString() || "")
        onStartEdit()
    }

    const handleSave = async () => {
        try {
            const numericValue = parseFloat(editingValue)
            if (isNaN(numericValue)) {
                console.error("Invalid numeric value")
                return
            }

            await onSave(numericValue)
            onCancelEdit()
        } catch (error) {
            console.error("Error saving value:", error)
        }
    }

    const handleCancel = () => {
        setEditingValue("")
        onCancelEdit()
    }

    const containerVariants = {
        editing: {
            transition: {
                staggerChildren: 0.1
            }
        },
        display: {
            transition: {
                staggerChildren: 0.05
            }
        }
    }

    const buttonVariants = {
        hidden: {
            opacity: 0,
            scale: 0.8,
            x: -10
        },
        visible: {
            opacity: 1,
            scale: 1,
            x: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
            }
        },
        exit: {
            opacity: 0,
            scale: 0.8,
            x: 10,
            transition: {
                duration: 0.2
            }
        }
    }

    const inputVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            x: -20
        },
        visible: {
            opacity: 1,
            scale: 1,
            x: 0,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 30
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            x: -20,
            transition: {
                duration: 0.2
            }
        }
    }

    const displayVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95
        },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 30,
                delay: 0.1
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: {
                duration: 0.15
            }
        }
    }

    return (
        <motion.div
            variants={containerVariants}
            animate={isEditing ? "editing" : "display"}
            style={{
                minHeight: "32px",
                display: "flex",
                alignItems: "center",
                width: "100%",
                overflow: "hidden"
            }}
        >
            <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.div
                        key="editing"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{ display: "flex", alignItems: "center" }}
                    >
                        <Space>
                            <motion.div variants={inputVariants}>
                                <Input
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onPressEnter={handleSave}
                                    style={{ width: "100px", minWidth: "80px" }}
                                    size="small"
                                />
                            </motion.div>
                            <motion.div variants={buttonVariants}>
                                <Button
                                    type="text"
                                    icon={<SaveOutlined />}
                                    onClick={handleSave}
                                    size="small"
                                />
                            </motion.div>
                            <motion.div variants={buttonVariants}>
                                <Button
                                    type="text"
                                    icon={<CloseOutlined />}
                                    onClick={handleCancel}
                                    size="small"
                                />
                            </motion.div>
                        </Space>
                    </motion.div>
                ) : (
                    <motion.div
                        key="display"
                        variants={displayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            padding: "4px 0",
                            gap: "8px"
                        }}
                        onClick={handleStartEdit}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <motion.div
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 0.5, rotate: 0 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                        >
                            <EditOutlined style={{ fontSize: "12px" }} />
                        </motion.div>
                        <motion.span
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.2 }}
                        >
                            {value}
                        </motion.span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default EditableNumberCell 