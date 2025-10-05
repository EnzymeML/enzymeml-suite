import { useEffect, useState } from 'react';

import { JupyterSessionInfo } from '@commands/jupyter';
import SessionItem from '@jupyter/components/SessionItem';
import TemplateButton from '@jupyter/components/TemplateButton';
import useJupyterStore from '@stores/jupyterstore';
import { fetchJupyterSessions, terminateJupyterSession } from '@jupyter/utils';
import useAppStore from '@stores/appstore';

/**
 * JupyterSessionList - Displays the list of Jupyter sessions or empty state
 */
export default function SessionList() {
    // States
    const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
    const [sessions, setSessions] = useState<JupyterSessionInfo[]>([]);

    // Global actions
    const removeSession = useJupyterStore(state => state.removeSession);
    const setNumberOfSessions = useJupyterStore(state => state.setNumberOfSessions);
    const openNotification = useAppStore(state => state.openNotification);

    // Fetch sessions on mount
    useEffect(() => {
        handleFetchSessions();
    }, [sessions]);

    /**
     * Fetches the list of active Jupyter sessions from the backend
     * and synchronizes the session count in the store
     */
    const handleFetchSessions = async () => {
        const result = await fetchJupyterSessions(openNotification);
        if (result) {
            setSessions(result);
            // Sync the store count with actual running sessions
            setNumberOfSessions(result.length);
        }
    };

    /**
     * Terminates a specific Jupyter session
     */
    const handleTerminateSession = async (sessionId: string) => {
        setActionLoading(prev => ({ ...prev, [sessionId]: true }));
        const success = await terminateJupyterSession(sessionId, openNotification);
        if (success) {
            // Refresh the sessions list
            removeSession();
            handleFetchSessions();
        }
        setActionLoading(prev => ({ ...prev, [sessionId]: false }));
    };

    return (
        <div className="flex flex-col space-y-2"> {/* <-- fix here */}
            {sessions.length > 0 && (
                sessions.map(session => (
                    <SessionItem
                        key={session.id}
                        session={session}
                        isTerminating={actionLoading[session.id] || false}
                        openNotification={openNotification}
                        onTerminate={handleTerminateSession}
                    />
                ))
            )}

            {/* Center the button row */}
            <div className="flex justify-center items-center mt-4 w-full">
                <TemplateButton write={sessions.length !== 0} />
            </div>
        </div>
    );
}
