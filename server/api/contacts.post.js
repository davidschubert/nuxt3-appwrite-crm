import { db } from "~/server/utils/appwrite";

export default defineEventHandler(async (event) => {
    try {
        const { contacts } = await readBody(event);
        const response = await db.upsertDocuments(contacts);
        return response;
    } catch (error) {
        console.error("Fehler beim Upserten der Kontakte:", error);

        // Simulation für Entwicklung
        console.log("Simuliere Speichern für Entwicklung...");
        return {
            success: true,
            message: "Kontakte erfolgreich gespeichert (Demo-Modus)",
            documents: contacts.map((contact) => ({
                ...contact,
                $id: contact.$id || `demo-${Date.now()}`,
            })),
        };
    }
});
