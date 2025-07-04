<template>
    <div class="container">
        <header>
            <h1>📊 Persönliches CRM Spreadsheet</h1>
            <p>Bearbeite mehrere Kontakte auf einmal</p>
        </header>

        <!-- Control Panel -->
        <section class="control-panel">
            <div class="stats">
                <span class="stat">Kontakte gesamt: {{ contacts.length }}</span>
                <span class="stat modified">Geändert: {{ modifiedCount }}</span>
            </div>
            <div class="actions">
                <button @click="addMoreRows" class="btn-secondary">
                    + Zeile hinzufügen
                </button>
                <button
                    @click="resetChanges"
                    class="btn-cancel"
                    :disabled="modifiedCount === 0"
                >
                    Änderungen zurücksetzen
                </button>
                <button
                    @click="saveAllChanges"
                    class="btn-primary"
                    :disabled="saving || modifiedCount === 0"
                >
                    {{
                        saving
                            ? "Speichern..."
                            : `Alle Änderungen speichern (${modifiedCount})`
                    }}
                </button>
                <button
                    @click="deleteAllContacts"
                    class="btn-danger"
                    :disabled="saving || contacts.length === 0"
                >
                    {{ saving ? "Löschen..." : "Alle löschen" }}
                </button>
            </div>
        </section>

        <!-- Spreadsheet Table -->
        <section class="spreadsheet">
            <div v-if="loading" class="loading">Lade Kontakte...</div>
            <div v-else class="table-container">
                <table class="contacts-table">
                    <thead>
                        <tr>
                            <th class="col-name">Name *</th>
                            <th class="col-email">E-Mail *</th>
                            <th class="col-phone">Telefon</th>
                            <th class="col-notes">Notizen</th>
                            <th class="col-actions">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(contact, index) in editingContacts"
                            :key="contact.$id || contact.tempId"
                            class="contact-row"
                            :class="{
                                'new-row': contact.isNew,
                                'modified-row': contact.isModified,
                            }"
                        >
                            <td class="col-name">
                                <input
                                    v-model="contact.name"
                                    @input="markAsModified(index)"
                                    placeholder="Name eingeben..."
                                    class="cell-input"
                                    :class="{ required: !contact.name.trim() }"
                                />
                            </td>
                            <td class="col-email">
                                <input
                                    v-model="contact.email"
                                    @input="markAsModified(index)"
                                    placeholder="E-Mail eingeben..."
                                    type="email"
                                    class="cell-input"
                                    :class="{ required: !contact.email.trim() }"
                                />
                            </td>
                            <td class="col-phone">
                                <input
                                    v-model="contact.phone"
                                    @input="markAsModified(index)"
                                    placeholder="Telefon eingeben..."
                                    class="cell-input"
                                />
                            </td>
                            <td class="col-notes">
                                <textarea
                                    v-model="contact.notes"
                                    @input="markAsModified(index)"
                                    placeholder="Notizen eingeben..."
                                    class="cell-textarea"
                                    rows="2"
                                ></textarea>
                            </td>
                            <td class="col-actions">
                                <button
                                    @click="deleteContact(contact, index)"
                                    class="btn-delete-small"
                                    :title="
                                        contact.isNew
                                            ? 'Zeile entfernen'
                                            : 'Kontakt löschen'
                                    "
                                >
                                    {{ contact.isNew ? "✕" : "🗑" }}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Help Section -->
        <section class="help-section">
            <h3>💡 So funktioniert's:</h3>
            <ul>
                <li>
                    <strong>Name</strong> und <strong>E-Mail</strong> sind
                    Pflichtfelder
                </li>
                <li>
                    Geänderte Zeilen werden in
                    <span class="highlight-blue">blau</span> hervorgehoben
                </li>
                <li>
                    Neue Zeilen werden in
                    <span class="highlight-green">grün</span> hervorgehoben
                </li>
                <li>
                    Klicke auf "Alle Änderungen speichern" um alle Änderungen in
                    einem Batch zu speichern
                </li>
                <li>
                    Verwende "Zeile hinzufügen" um eine zusätzliche leere Zeile
                    für neue Kontakte zu erhalten
                </li>
            </ul>
        </section>
    </div>
</template>

<script setup>
    import { ref, computed, onMounted } from "vue";

    useHead({
        title: "Persönliches CRM",
    });

    const contacts = ref([]);
    const editingContacts = ref([]);
    const loading = ref(false);
    const saving = ref(false);

    // Mit einer leeren Zeile für neue Kontakte initialisieren
    function initializeEmptyRows() {
        const emptyRow = {
            tempId: `temp_${Date.now()}`,
            name: "",
            email: "",
            phone: "",
            notes: "",
            isNew: true,
            isModified: false,
        };
        editingContacts.value = [
            ...contacts.value.map((c) => ({
                ...c,
                isNew: false,
                isModified: false,
            })),
            emptyRow,
        ];
    }

    // Alle Kontakte laden
    async function loadContacts() {
        loading.value = true;
        try {
            const data = await $fetch("/api/contacts");
            contacts.value = data || [];
            initializeEmptyRows();
        } catch (error) {
            console.error("Fehler beim Laden der Kontakte:", error);
            contacts.value = [];
            initializeEmptyRows();
        }
        loading.value = false;
    }

    // Kontakt als geändert markieren
    function markAsModified(index) {
        editingContacts.value[index].isModified = true;
    }

    // Eine weitere leere Zeile hinzufügen
    function addMoreRows() {
        const newRow = {
            tempId: `temp_${Date.now()}`,
            name: "",
            email: "",
            phone: "",
            notes: "",
            isNew: true,
            isModified: false,
        };
        editingContacts.value.push(newRow);
    }

    // Alle Änderungen speichern (Batch Upsert)
    async function saveAllChanges() {
        saving.value = true;
        try {
            // Leere Zeilen herausfiltern und nur geänderte/neue Kontakte abrufen
            const contactsToSave = editingContacts.value
                .filter((contact) => {
                    return (
                        (contact.isModified || contact.isNew) &&
                        contact.name.trim() &&
                        contact.email.trim()
                    );
                })
                .map((contact) => {
                    const { tempId, isNew, isModified, ...contactData } =
                        contact;
                    return contactData;
                });

            if (contactsToSave.length === 0) {
                alert(
                    "Keine Änderungen zu speichern oder fehlende Pflichtfelder (Name, E-Mail)"
                );
                saving.value = false;
                return;
            }

            await $fetch("/api/contacts", {
                method: "POST",
                body: { contacts: contactsToSave },
            });

            await loadContacts();
            alert(
                `${contactsToSave.length} Kontakt(e) erfolgreich gespeichert!`
            );
        } catch (error) {
            console.error("Fehler beim Speichern der Kontakte:", error);
            alert(
                "Fehler beim Speichern der Kontakte. Bitte versuche es erneut."
            );
        }
        saving.value = false;
    }

    // Kontakt löschen
    async function deleteContact(contact, index) {
        if (contact.isNew) {
            // Nur aus dem Array entfernen, wenn es ein neuer ungespeicherter Kontakt ist
            editingContacts.value.splice(index, 1);
            return;
        }

        if (
            !confirm(
                `Bist du sicher, dass du ${contact.name} löschen möchtest?`
            )
        ) {
            return;
        }

        try {
            await $fetch("/api/contacts", {
                method: "DELETE",
                body: { id: contact.$id },
            });

            await loadContacts();
        } catch (error) {
            console.error("Fehler beim Löschen des Kontakts:", error);
        }
    }

    // Alle Kontakte löschen
    async function deleteAllContacts() {
        if (contacts.value.length === 0) {
            alert("Keine Kontakte zum Löschen vorhanden");
            return;
        }

        if (
            !confirm(
                `Bist du sicher, dass du ALLE ${contacts.value.length} Kontakte löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.`
            )
        ) {
            return;
        }

        saving.value = true;
        try {
            await $fetch("/api/contacts", {
                method: "DELETE",
                body: {}, // Leerer Body für "alle löschen"
            });

            await loadContacts();
            alert("Alle Kontakte wurden erfolgreich gelöscht");
        } catch (error) {
            console.error("Fehler beim Löschen aller Kontakte:", error);
            alert(
                "Fehler beim Löschen der Kontakte. Bitte versuche es erneut."
            );
        }
        saving.value = false;
    }

    // Alle Änderungen zurücksetzen
    function resetChanges() {
        if (
            confirm(
                "Bist du sicher, dass du alle ungespeicherten Änderungen zurücksetzen möchtest?"
            )
        ) {
            initializeEmptyRows();
        }
    }

    // Geänderte Kontakte zählen
    const modifiedCount = computed(() => {
        return editingContacts.value.filter(
            (c) =>
                c.isModified || (c.isNew && (c.name.trim() || c.email.trim()))
        ).length;
    });

    onMounted(loadContacts);
</script>
