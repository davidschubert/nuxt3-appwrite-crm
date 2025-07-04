Appwrite Node.js SDK installieren
Da die Bulk API derzeit nur in Appwrites serverseitigen SDKs verfügbar ist, installieren wir das Appwrite Node.js SDK:
bashnpm install node-appwrite
Erstelle im Stammverzeichnis deiner App eine .env-Datei und füge die Informationen hinzu, die du aus deinem Appwrite-Projekt gespeichert hast:
envNUXT_APPWRITE_ENDPOINT=https://<REGION>.cloud.appwrite.io/v1
NUXT_APPWRITE_PROJECT_ID=<PROJECT_ID>
NUXT_APPWRITE_API_KEY=<API_KEY>
NUXT_APPWRITE_DATABASE_ID=crm
NUXT_APPWRITE_COLLECTION_ID=contacts
Als nächstes erstelle im server/utils-Verzeichnis (erstelle es, falls es nicht existiert) eine Datei appwrite.js und füge folgenden Code hinzu:
javascript// server/utils/appwrite.js
import { Client, Databases, ID } from 'node-appwrite';

const config = useRuntimeConfig();

const client = new Client()
.setEndpoint(config.appwriteEndpoint)
.setProject(config.appwriteProjectId)
.setKey(config.appwriteApiKey);

const databases = new Databases(client);
const databaseId = config.appwriteDatabaseId;
const collectionId = config.appwriteCollectionId;

// Kontakte hinzufügen oder aktualisieren
async function upsertDocuments(contacts) {
try {
const documents = contacts.map((contact) => ({
$id: contact.$id || ID.unique(),
name: contact.name,
email: contact.email,
phone: contact.phone,
notes: contact.notes
}));
return await databases.upsertDocuments(databaseId, collectionId, documents);
} catch (error) {
console.error('Fehler beim Upserten der Dokumente:', error);
throw new Error('Dokumente konnten nicht upsertet werden');
}
}

// Einzelnen Kontakt löschen
async function deleteDocument(id) {
try {
return await databases.deleteDocument(databaseId, collectionId, id);
} catch (error) {
console.error('Fehler beim Löschen des Dokuments:', error);
throw new Error('Dokument konnte nicht gelöscht werden');
}
}

// Alle Kontakte löschen
async function deleteDocuments() {
try {
return await databases.deleteDocuments(databaseId, collectionId, []);
} catch (error) {
console.error('Fehler beim Löschen der Dokumente:', error);
throw new Error('Dokumente konnten nicht gelöscht werden');
}
}

// Kontakte auflisten
async function listDocuments() {
try {
return await databases.listDocuments(databaseId, collectionId);
} catch (error) {
console.error('Fehler beim Abrufen der Dokumente:', error);
throw new Error('Dokumente konnten nicht abgerufen werden');
}
}

export const db = {
upsertDocuments,
deleteDocument,
deleteDocuments,
listDocuments
};
Nuxt-Konfiguration aktualisieren
Aktualisiere deine nuxt.config.ts-Datei, um die Umgebungsvariablen zu konfigurieren:
typescript// nuxt.config.ts
export default defineNuxtConfig({
devtools: { enabled: true },
css: ['~/assets/css/main.css'],
runtimeConfig: {
appwriteEndpoint: process.env.NUXT_APPWRITE_ENDPOINT,
appwriteProjectId: process.env.NUXT_APPWRITE_PROJECT_ID,
appwriteApiKey: process.env.NUXT_APPWRITE_API_KEY,
appwriteDatabaseId: process.env.NUXT_APPWRITE_DATABASE_ID,
appwriteCollectionId: process.env.NUXT_APPWRITE_COLLECTION_ID,
}
})
Web-App entwickeln
Jetzt, da das Appwrite SDK installiert und die Bibliotheksfunktionen eingerichtet sind, können wir die Web-App erstellen.
API-Routen vorbereiten
Erstelle im server/api-Verzeichnis eine Datei contacts.get.js für das Abrufen der Kontakte:
javascript// server/api/contacts.get.js
import { db } from '~/server/utils/appwrite';

export default defineEventHandler(async (event) => {
try {
const response = await db.listDocuments();
return response.documents;
} catch (error) {
console.error('Fehler beim Abrufen der Kontakte:', error);
throw createError({
statusCode: 500,
statusMessage: 'Kontakte konnten nicht abgerufen werden'
});
}
});
Erstelle eine Datei contacts.post.js für das Upserten der Kontakte:
javascript// server/api/contacts.post.js
import { db } from '~/server/utils/appwrite';

export default defineEventHandler(async (event) => {
try {
const { contacts } = await readBody(event);
const response = await db.upsertDocuments(contacts);
return response;
} catch (error) {
console.error('Fehler beim Upserten der Kontakte:', error);
throw createError({
statusCode: 500,
statusMessage: 'Kontakte konnten nicht upsertet werden'
});
}
});
Erstelle eine Datei contacts.delete.js für das Löschen der Kontakte:
javascript// server/api/contacts.delete.js
import { db } from '~/server/utils/appwrite';

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
console.error('Fehler beim Löschen der Kontakte:', error);
throw createError({
statusCode: 500,
statusMessage: 'Kontakte konnten nicht gelöscht werden'
});
}
});
Hauptseite hinzufügen
Erstelle oder aktualisiere die Datei pages/index.vue:
vue<template>

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
          {{ saving ? 'Speichern...' : `Alle Änderungen speichern (${modifiedCount})` }}
        </button>
        <button
          @click="deleteAllContacts"
          class="btn-danger"
          :disabled="saving || contacts.length === 0"
        >
          {{ saving ? 'Löschen...' : 'Alle löschen' }}
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
                'modified-row': contact.isModified
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
                  :title="contact.isNew ? 'Zeile entfernen' : 'Kontakt löschen'"
                >
                  {{ contact.isNew ? '✕' : '🗑' }}
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
        <li><strong>Name</strong> und <strong>E-Mail</strong> sind Pflichtfelder</li>
        <li>Geänderte Zeilen werden in <span class="highlight-blue">blau</span> hervorgehoben</li>
        <li>Neue Zeilen werden in <span class="highlight-green">grün</span> hervorgehoben</li>
        <li>Klicke auf "Alle Änderungen speichern" um alle Änderungen in einem Batch zu speichern</li>
        <li>Verwende "Zeile hinzufügen" um eine zusätzliche leere Zeile für neue Kontakte zu erhalten</li>
      </ul>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

useHead({
  title: 'Persönliches CRM'
});

const contacts = ref([]);
const editingContacts = ref([]);
const loading = ref(false);
const saving = ref(false);

// Mit einer leeren Zeile für neue Kontakte initialisieren
function initializeEmptyRows() {
  const emptyRow = {
    tempId: `temp_${Date.now()}`,
    name: '',
    email: '',
    phone: '',
    notes: '',
    isNew: true,
    isModified: false
  };
  editingContacts.value = [
    ...contacts.value.map((c) => ({ ...c, isNew: false, isModified: false })),
    emptyRow
  ];
}

// Alle Kontakte laden
async function loadContacts() {
  loading.value = true;
  try {
    const { data } = await $fetch('/api/contacts');
    contacts.value = data || [];
    initializeEmptyRows();
  } catch (error) {
    console.error('Fehler beim Laden der Kontakte:', error);
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
    name: '',
    email: '',
    phone: '',
    notes: '',
    isNew: true,
    isModified: false
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
        const { tempId, isNew, isModified, ...contactData } = contact;
        return contactData;
      });

    if (contactsToSave.length === 0) {
      alert('Keine Änderungen zu speichern oder fehlende Pflichtfelder (Name, E-Mail)');
      saving.value = false;
      return;
    }

    await $fetch('/api/contacts', {
      method: 'POST',
      body: { contacts: contactsToSave }
    });

    await loadContacts();
    alert(`${contactsToSave.length} Kontakt(e) erfolgreich gespeichert!`);
  } catch (error) {
    console.error('Fehler beim Speichern der Kontakte:', error);
    alert('Fehler beim Speichern der Kontakte. Bitte versuche es erneut.');
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

  if (!confirm(`Bist du sicher, dass du ${contact.name} löschen möchtest?`)) {
    return;
  }

  try {
    await $fetch('/api/contacts', {
      method: 'DELETE',
      body: { id: contact.$id }
    });

    await loadContacts();
  } catch (error) {
    console.error('Fehler beim Löschen des Kontakts:', error);
  }
}

// Alle Kontakte löschen
async function deleteAllContacts() {
  if (contacts.value.length === 0) {
    alert('Keine Kontakte zum Löschen vorhanden');
    return;
  }

  if (!confirm(`Bist du sicher, dass du ALLE ${contacts.value.length} Kontakte löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
    return;
  }

  saving.value = true;
  try {
    await $fetch('/api/contacts', {
      method: 'DELETE',
      body: {} // Leerer Body für "alle löschen"
    });

    await loadContacts();
    alert('Alle Kontakte wurden erfolgreich gelöscht');
  } catch (error) {
    console.error('Fehler beim Löschen aller Kontakte:', error);
    alert('Fehler beim Löschen der Kontakte. Bitte versuche es erneut.');
  }
  saving.value = false;
}

// Alle Änderungen zurücksetzen
function resetChanges() {
  if (confirm('Bist du sicher, dass du alle ungespeicherten Änderungen zurücksetzen möchtest?')) {
    initializeEmptyRows();
  }
}

// Geänderte Kontakte zählen
const modifiedCount = computed(() => {
  return editingContacts.value.filter(
    (c) => c.isModified || (c.isNew && (c.name.trim() || c.email.trim()))
  ).length;
});

onMounted(loadContacts);
</script>

Styling hinzufügen
Erstelle eine Datei assets/css/main.css und füge das CSS aus dem Original GitHub Repository ein, oder erstelle dein eigenes Styling.
Hier ist ein grundlegendes CSS-Beispiel:
css/_ assets/css/main.css _/

-   {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    }

body {
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
background-color: #f5f5f5;
color: #333;
}

.container {
max-width: 1200px;
margin: 0 auto;
padding: 20px;
}

header {
text-align: center;
margin-bottom: 30px;
}

header h1 {
font-size: 2.5em;
margin-bottom: 10px;
}

.control-panel {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 20px;
padding: 15px;
background: white;
border-radius: 8px;
box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stats {
display: flex;
gap: 20px;
}

.stat {
font-weight: 600;
}

.stat.modified {
color: #007bff;
}

.actions {
display: flex;
gap: 10px;
}

button {
padding: 8px 16px;
border: none;
border-radius: 4px;
cursor: pointer;
font-size: 14px;
transition: background-color 0.2s;
}

.btn-primary {
background-color: #007bff;
color: white;
}

.btn-primary:hover:not(:disabled) {
background-color: #0056b3;
}

.btn-secondary {
background-color: #6c757d;
color: white;
}

.btn-secondary:hover {
background-color: #545b62;
}

.btn-cancel {
background-color: #ffc107;
color: #212529;
}

.btn-cancel:hover:not(:disabled) {
background-color: #e0a800;
}

.btn-danger {
background-color: #dc3545;
color: white;
}

.btn-danger:hover:not(:disabled) {
background-color: #c82333;
}

button:disabled {
opacity: 0.6;
cursor: not-allowed;
}

.spreadsheet {
background: white;
border-radius: 8px;
box-shadow: 0 2px 4px rgba(0,0,0,0.1);
overflow: hidden;
}

.loading {
text-align: center;
padding: 40px;
font-size: 18px;
color: #666;
}

.table-container {
overflow-x: auto;
}

.contacts-table {
width: 100%;
border-collapse: collapse;
}

.contacts-table th,
.contacts-table td {
padding: 12px;
text-align: left;
border-bottom: 1px solid #e0e0e0;
}

.contacts-table th {
background-color: #f8f9fa;
font-weight: 600;
position: sticky;
top: 0;
}

.cell-input,
.cell-textarea {
width: 100%;
padding: 8px;
border: 1px solid #ddd;
border-radius: 4px;
font-size: 14px;
}

.cell-input:focus,
.cell-textarea:focus {
outline: none;
border-color: #007bff;
}

.cell-input.required {
border-color: #dc3545;
}

.new-row {
background-color: #d4edda;
}

.modified-row {
background-color: #d1ecf1;
}

.btn-delete-small {
background-color: transparent;
color: #dc3545;
border: 1px solid #dc3545;
padding: 4px 8px;
font-size: 12px;
}

.btn-delete-small:hover {
background-color: #dc3545;
color: white;
}

.help-section {
margin-top: 30px;
padding: 20px;
background: white;
border-radius: 8px;
box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.help-section h3 {
margin-bottom: 15px;
}

.help-section ul {
list-style: none;
padding-left: 20px;
}

.help-section li {
margin-bottom: 10px;
}

.highlight-blue {
color: #007bff;
font-weight: 600;
}

.highlight-green {
color: #28a745;
font-weight: 600;
}

/_ Responsive Design _/
@media (max-width: 768px) {
.control-panel {
flex-direction: column;
gap: 15px;
}

.actions {
flex-wrap: wrap;
}

.table-container {
overflow-x: scroll;
}
}
App testen
Um die App lokal zu deployen und zu testen, führe folgenden Befehl in deinem Terminal aus:
bashnpm run dev
Besuche dann http://localhost:3000 in deinem Browser und probiere die App aus.
