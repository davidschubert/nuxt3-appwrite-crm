import { Client, Databases, ID } from "node-appwrite";

// Hilfsfunktion zum Erstellen des Appwrite-Clients
function createAppwriteClient() {
    const config = useRuntimeConfig();

    // Fallback-Werte für Entwicklung
    const endpoint = config.appwriteEndpoint || "https://cloud.appwrite.io/v1";
    const projectId = config.appwriteProjectId || "demo-project";
    const apiKey = config.appwriteApiKey || "demo-key";

    // Validierung der URL
    if (!endpoint || endpoint === "") {
        console.warn("Appwrite endpoint nicht konfiguriert, verwende Fallback");
    }

    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    return client;
}

// Kontakte hinzufügen oder aktualisieren
async function upsertDocuments(contacts) {
    try {
        const config = useRuntimeConfig();
        const client = createAppwriteClient();
        const databases = new Databases(client);
        const databaseId = config.appwriteDatabaseId || "crm";
        const collectionId = config.appwriteCollectionId || "contacts";

        const documents = contacts.map((contact) => ({
            $id: contact.$id || ID.unique(),
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            notes: contact.notes,
        }));

        return await databases.upsertDocuments(
            databaseId,
            collectionId,
            documents
        );
    } catch (error) {
        console.error("Fehler beim Upserten der Dokumente:", error);
        throw new Error("Dokumente konnten nicht upsertet werden");
    }
}

// Einzelnen Kontakt löschen
async function deleteDocument(id) {
    try {
        const config = useRuntimeConfig();
        const client = createAppwriteClient();
        const databases = new Databases(client);
        const databaseId = config.appwriteDatabaseId || "crm";
        const collectionId = config.appwriteCollectionId || "contacts";

        return await databases.deleteDocument(databaseId, collectionId, id);
    } catch (error) {
        console.error("Fehler beim Löschen des Dokuments:", error);
        throw new Error("Dokument konnte nicht gelöscht werden");
    }
}

// Alle Kontakte löschen
async function deleteDocuments() {
    try {
        const config = useRuntimeConfig();
        const client = createAppwriteClient();
        const databases = new Databases(client);
        const databaseId = config.appwriteDatabaseId || "crm";
        const collectionId = config.appwriteCollectionId || "contacts";

        return await databases.deleteDocuments(databaseId, collectionId, []);
    } catch (error) {
        console.error("Fehler beim Löschen der Dokumente:", error);
        throw new Error("Dokumente konnten nicht gelöscht werden");
    }
}

// Kontakte auflisten
async function listDocuments() {
    try {
        const config = useRuntimeConfig();
        const client = createAppwriteClient();
        const databases = new Databases(client);
        const databaseId = config.appwriteDatabaseId || "crm";
        const collectionId = config.appwriteCollectionId || "contacts";

        return await databases.listDocuments(databaseId, collectionId);
    } catch (error) {
        console.error("Fehler beim Abrufen der Dokumente:", error);
        throw new Error("Dokumente konnten nicht abgerufen werden");
    }
}

export const db = {
    upsertDocuments,
    deleteDocument,
    deleteDocuments,
    listDocuments,
};
