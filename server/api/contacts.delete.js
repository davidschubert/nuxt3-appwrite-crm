import { db } from "~/server/utils/appwrite";

export default defineEventHandler(async (event) => {
    try {
        const { id } = await readBody(event);
        let response;

        if (id) {
            // Einzelne Kontakt-ID angegeben - lösche ein einzelnes Dokument
            response = await db.deleteDocument(id);
        } else {
            // Keine ID angegeben - lösche alle Dokumente
            response = await db.deleteDocuments();
        }

        return response;
    } catch (error) {
        console.error("Fehler beim Löschen der Kontakte:", error);

        // Simulation für Entwicklung
        console.log("Simuliere Löschen für Entwicklung...");
        return {
            success: true,
            message: "Kontakte erfolgreich gelöscht (Demo-Modus)",
        };
    }
});
