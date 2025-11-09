import type { AppData, Case } from '../types';

const APP_DATA_KEY = 'cancerx_data';
const API_KEY_STORAGE_KEY = 'cancerx_api_key';


// This function prepares data for storage. It strips out non-serializable File objects
// but keeps everything else, including the essential `dataUrl` for images.
const serialize = (data: AppData): object => {
    return {
        ...data,
        cases: data.cases.map(c => ({
            ...c,
            nodes: c.nodes.map(({ file, ...rest }) => ({
                ...rest,
                // Store file metadata for rehydration
                file: { name: file.name, type: file.type },
            })),
        })),
    };
};

// This function rehydrates the data after loading, recreating placeholder File objects.
const deserialize = (data: any): AppData => {
     if (!data || !data.cases || !Array.isArray(data.cases)) return { users: [], cases: [] };
     return {
        ...data,
        cases: (data.cases as any[]).map(c => ({
            ...c,
            isVisible: c.isVisible === undefined ? true : c.isVisible, // Add isVisible flag for migration
            nodes: c.nodes ? c.nodes.map((n: any) => ({
                ...n,
                file: new File([], n.file.name, { type: n.file.type }),
            })) : [],
        })),
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
            let parsedData = JSON.parse(data);

            // One-time migration for old data structure
            if (parsedData.cases && !Array.isArray(parsedData.cases) && typeof parsedData.cases === 'object') {
                console.log("Migrating old case data structure to new flat structure.");
                const migratedCases: any[] = [];
                Object.entries(parsedData.cases).forEach(([userId, userCases]) => {
                    if (Array.isArray(userCases)) {
                        (userCases as any[]).forEach(caseObj => {
                            migratedCases.push({ ...caseObj, userId });
                        });
                    }
                });
                parsedData.cases = migratedCases;
            }

            return deserialize(parsedData);
        }
    } catch (error) {
        console.error("Error reading from localStorage", error);
    }
    // Return the new default structure
    return { users: [], cases: [] };
};

export const saveApiKey = (key: string): void => {
    try {
        window.localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } catch (error) {
        console.error("Error saving API key to localStorage", error);
    }
};

export const getApiKey = (): string | null => {
    try {
        return window.localStorage.getItem(API_KEY_STORAGE_KEY);
    } catch (error) {
        console.error("Error reading API key from localStorage", error);
        return null;
    }
};

export const removeApiKey = (): void => {
    try {
        window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch (error) {
        console.error("Error removing API key from localStorage", error);
    }
};