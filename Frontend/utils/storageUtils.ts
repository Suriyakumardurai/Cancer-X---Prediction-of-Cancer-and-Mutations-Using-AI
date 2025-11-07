
import type { AppData, Case } from '../types';

const APP_DATA_KEY = 'cancerx_data';

// This function prepares data for storage. It strips out non-serializable File objects
// but keeps everything else, including the essential `dataUrl` for images.
const serialize = (data: AppData): object => {
    return {
        ...data,
        cases: Object.fromEntries(
            Object.entries(data.cases).map(([userId, userCases]) => [
                userId,
                userCases.map(c => ({
                    ...c,
                    nodes: c.nodes.map(({ file, ...rest }) => ({
                        ...rest,
                        // Store file metadata for rehydration
                        file: { name: file.name, type: file.type },
                    })),
                })),
            ])
        ),
    };
};

// This function rehydrates the data after loading, recreating placeholder File objects.
const deserialize = (data: any): AppData => {
     if (!data || !data.cases) return { users: [], cases: {} };
     return {
        ...data,
        cases: Object.fromEntries(
            Object.entries(data.cases as Record<string, Case[]>).map(([userId, userCases]) => [
                userId,
                userCases.map(c => ({
                    ...c,
                    nodes: c.nodes.map((n: any) => ({
                        ...n,
                        file: new File([], n.file.name, { type: n.file.type }),
                    })),
                })),
            ])
        ),
     };
};


export const saveAppData = (data: AppData): void => {
    try {
        const serializableData = serialize(data);
        window.localStorage.setItem(APP_DATA_KEY, JSON.stringify(serializableData));
    } catch (error) {
        console.error("Error saving to localStorage", error);
    }
};

export const getAppData = (): AppData => {
    try {
        const data = window.localStorage.getItem(APP_DATA_KEY);
        if (data) {
            return deserialize(JSON.parse(data));
        }
    } catch (error) {
        console.error("Error reading from localStorage", error);
    }
    return { users: [], cases: {} };
};
