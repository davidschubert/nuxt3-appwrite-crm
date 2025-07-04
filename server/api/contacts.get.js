import { db } from "~/server/utils/appwrite";

export default defineEventHandler(async (event) => {
    try {
        const response = await db.listDocuments();
        return response.documents || [];
    } catch (error) {
        console.error("Fehler beim Abrufen der Kontakte:", error);

        // Temporäre Demo-Daten für Entwicklung
        console.log("Verwende Demo-Daten für Entwicklung...");
        return [
            {
                $id: "demo-1",
                name: "Max Mustermann",
                email: "max@example.com",
                phone: "+49 123 456789",
                notes: "Wichtiger Kunde",
            },
            {
                $id: "demo-2",
                name: "Anna Schmidt",
                email: "anna@example.com",
                phone: "+49 987 654321",
                notes: "Interessiert an Produkt A",
            },
        ];
    }
});
