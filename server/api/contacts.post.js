import { db } from "~/server/utils/appwrite";

export default defineEventHandler(async (event) => {
    let contacts;
    try {
        ({ contacts } = await readBody(event));
        const response = await db.upsertDocuments(contacts);
        return response;
    } catch (error) {
        console.error("Fehler beim Upserten der Kontakte:", error);

        // Simulation für Entwicklung
        console.log("Simuliere Speichern für Entwicklung...");
        const documents = Array.isArray(contacts)
            ? contacts.map((contact) => ({
                  ...contact,
                  $id: contact.$id || `demo-${Date.now()}`,
              }))
            : [];
        return {
            success: true,
            message: "Kontakte erfolgreich gespeichert (Demo-Modus)",
            documents,
        };
    }
});
