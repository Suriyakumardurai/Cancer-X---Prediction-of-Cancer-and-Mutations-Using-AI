
// FIX: Imported 'useMemo' from 'react' to resolve the undefined error.
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAppData, saveAppData } from './utils/storageUtils';
import type { AppData, User, Case } from './types';

export const useAppData = () => {
    const [appData, setAppData] = useState<AppData>(getAppData);

    // This effect ensures any change to appData is persisted to localStorage.
    useEffect(() => {
        saveAppData(appData);
    }, [appData]);

    const addUser = useCallback((newUser: User) => {
        setAppData(prev => ({
            ...prev,
            users: [...prev.users, newUser],
        }));
    }, []);

    const updateUser = useCallback((updatedUser: User) => {
        setAppData(prev => ({
            ...prev,
            users: prev.users.map(u => u.id === updatedUser.id ? updatedUser : u),
        }));
    }, []);

    const addCase = useCallback((newCase: Case) => {
        setAppData(prev => ({
            ...prev,
            cases: [...prev.cases, newCase],
        }));
    }, []);

    const updateCase = useCallback((caseId: string, updater: (currentCase: Case) => Case) => {
        setAppData(prev => ({
            ...prev,
            cases: prev.cases.map(c => (c.id === caseId ? updater(c) : c)),
        }));
    }, []);

    const renameCase = useCallback((caseId: string, newName: string) => {
        updateCase(caseId, c => ({ ...c, name: newName.trim() }));
    }, [updateCase]);

    const deleteCase = useCallback((caseId: string) => {
        setAppData(prev => ({
            ...prev,
            cases: prev.cases.filter(c => c.id !== caseId),
        }));
    }, []);

    // Memoize the actions object to ensure it has a stable identity across re-renders.
    const actions = useMemo(() => ({
        addUser,
        updateUser,
        addCase,
        updateCase,
        renameCase,
        deleteCase,
    }), [addUser, updateUser, addCase, updateCase, renameCase, deleteCase]);

    return {
        appData,
        actions,
    };
};
