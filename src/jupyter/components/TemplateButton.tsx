import { useState, useEffect, useMemo } from 'react';
import { Dropdown, message, theme } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import { getJupyterTemplateMetadata, createJupyterSession, addTemplateToProject } from '@jupyter/utils';
import { JupyterTemplate } from '@commands/jupyter';
import useAppStore from '@stores/appstore';
import useJupyterStore from '@stores/jupyterstore';
import TemplateLabel from '@jupyter/components/TemplateLabel';

/**
 * Converts templates data into grouped menu items for the cascading dropdown
 * 
 * Takes the flat array of templates and organizes them into a hierarchical
 * structure grouped by category. Each category becomes a group with its
 * templates as children.
 * 
 * @returns {MenuProps['items']} Array of grouped menu items organized by category
 */
const createGroupedMenuItems = (templatesData: JupyterTemplate[]): MenuProps['items'] => {
    // Group templates by category
    const groupedByCategory = templatesData.reduce((acc, template, index) => {
        const category = template.category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push({
            key: `template-${index}`,
            label: <TemplateLabel name={template.name} description={template.description} />,
        });
        return acc;
    }, {} as { [key: string]: { key: string; label: JSX.Element; }[] });

    // Convert to cascading menu structure
    return Object.entries(groupedByCategory).map(([category, templates]) => ({
        key: `category-${category}`,
        type: 'group' as const,
        label: <TemplateLabel name={category} description="" groupName={category} />,
        children: templates,
    }));
};

/**
 * TemplateButton component for selecting and creating Jupyter notebook sessions
 * 
 * This component provides a cascading dropdown menu for choosing from
 * various Jupyter notebook templates organized by category groups,
 * and handles creating new sessions with the selected template.
 * 
 * Features:
 * - Grouped templates by category for better organization
 * - Category-based grouping with visual separation
 * - Template metadata including descriptions and repository links
 * - Internal state management for selected template
 * - Session creation functionality
 * - Dynamic button text based on selection
 * 
 * Categories include:
 * - Basic: Fundamental templates for getting started
 * - Parameter Estimation: Templates for fitting kinetic parameters
 * - Machine Learning: Neural network and ML-based approaches
 * - Simulation: Forward simulation templates
 * 
 * @component
 * @example
 * ```tsx
 * <TemplateButton />
 * ```
 * 
 * @returns {JSX.Element} JSX element containing the template selection and session creation interface
 */
export default function TemplateButton({ write = false }: { write?: boolean }) {
    // State for templates data and selection
    const [templatesData, setTemplatesData] = useState<JupyterTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<JupyterTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [creatingSession, setCreatingSession] = useState(false);

    // Global stores and actions
    const openNotification = useAppStore(state => state.openNotification);
    const addSession = useJupyterStore(state => state.addSession);

    // Styling
    const darkMode = useAppStore(state => state.darkMode);
    const { token } = theme.useToken();

    // Fetch templates data on component mount
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const data = await getJupyterTemplateMetadata();
                setTemplatesData(data);
            } catch (error) {
                console.error('Failed to fetch template metadata:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, []);

    // Memoize the grouped menu items to avoid re-computation on every render
    const menuItems = useMemo(() => createGroupedMenuItems(templatesData), [templatesData]);

    // Find the selected template object from the template name
    const selectedTemplateObj = useMemo(() => {
        if (!selectedTemplate || templatesData.length === 0) return null;
        return templatesData.find(template => template.name === selectedTemplate.name) || null;
    }, [selectedTemplate, templatesData]);

    /**
     * Handles menu item clicks for template selection
     * 
     * Only processes clicks on actual template items (not category groups).
     * Extracts the selected template data, updates state, and displays a success message.
     * 
     * @param {object} e - Menu click event object
     * @param {string} e.key - The key of the clicked menu item
     */
    const handleMenuClick: MenuProps['onClick'] = (e) => {
        // Only handle clicks on actual templates (not category groups)
        if (e.key.startsWith('template-')) {
            const templateIndex = parseInt(e.key.split('-')[1]);
            const template = templatesData[templateIndex] as JupyterTemplate;

            setSelectedTemplate(template);
            message.success(`Selected template: ${template.name}`);
            console.log('selected template:', template);
        }
    };

    /**
     * Creates a new Jupyter session with the selected template
     */
    const handleCreateSession = async () => {
        if (!selectedTemplate) {
            message.warning('Please select a template first');
            return;
        }

        setCreatingSession(true);
        try {
            let success = false;
            if (write) {
                success = await addTemplateToProject(openNotification, selectedTemplate.template_path);
            } else {
                success = await createJupyterSession(openNotification, selectedTemplate.template_path);
            }

            if (success) {
                if (!write) {
                    addSession();
                }
                // Reset template selection after successful creation
                setSelectedTemplate(null);
                message.success(write ? 'Template added to project' : 'Session created successfully');
            }
        } catch (error) {
            console.error('Failed to create session:', error);
        } finally {
            setCreatingSession(false);
        }
    };

    // Determine button text based on selected template state
    const buttonText = selectedTemplateObj
        ? `Create Session: ${selectedTemplateObj.name}`
        : 'Select Template';

    return (
        <div className="flex justify-center items-center">
            <Dropdown.Button
                type="primary"
                size="small"
                icon={<DownOutlined />}
                menu={{ items: menuItems, onClick: handleMenuClick }}
                placement="bottom"
                overlayStyle={{
                    width: "300px",
                    backgroundColor: darkMode ? token.colorBgContainer : token.colorBgLayout,
                    borderRadius: token.borderRadiusLG,
                    borderColor: darkMode ? token.colorBgTextActive : token.colorBorder,
                    borderWidth: "1px",
                    borderStyle: "solid",
                    overflow: 'hidden',
                    boxShadow: token.boxShadow,
                }}
                loading={loading || creatingSession}
                onClick={handleCreateSession}
            >
                <span className="text-xs font-medium">
                    {creatingSession ? 'Creating...' : buttonText}
                </span>
            </Dropdown.Button>
        </div >
    );
}
