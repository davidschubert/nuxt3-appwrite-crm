# Appwrite Setup für CRM-Projekt

## 1. Appwrite Console öffnen

Gehen Sie zu https://cloud.appwrite.io und melden Sie sich an.

## 2. Datenbank erstellen

1. Klicken Sie auf "Databases" im linken Menü
2. Klicken Sie auf "Create Database"
3. Name: `crm`
4. Klicken Sie auf "Create"

## 3. Collection erstellen

1. Klicken Sie auf die `crm` Datenbank
2. Klicken Sie auf "Create Collection"
3. Name: `contacts`
4. Klicken Sie auf "Create"

## 4. Attribute hinzufügen

Fügen Sie folgende Attribute zur `contacts` Collection hinzu:

### Name (String)

-   Attribute ID: `name`
-   Required: ✅
-   Default: (leer)

### Email (String)

-   Attribute ID: `email`
-   Required: ✅
-   Default: (leer)

### Phone (String)

-   Attribute ID: `phone`
-   Required: ❌
-   Default: (leer)

### Notes (String)

-   Attribute ID: `notes`
-   Required: ❌
-   Default: (leer)

## 5. API-Key erstellen

1. Gehen Sie zu "API Keys" im linken Menü
2. Klicken Sie auf "Create API Key"
3. Name: `CRM API Key`
4. Berechtigungen:
    - ✅ `databases.read`
    - ✅ `databases.write`
    - ✅ `databases.delete`
5. Klicken Sie auf "Create"
6. **Wichtig**: Kopieren Sie den API-Key sofort!

## 6. .env-Datei aktualisieren

```env
NUXT_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NUXT_APPWRITE_PROJECT_ID=YOUR_PROJECT_ID
NUXT_APPWRITE_API_KEY=YOUR_API_KEY
NUXT_APPWRITE_DATABASE_ID=crm
NUXT_APPWRITE_COLLECTION_ID=contacts
```

## 7. Testen

Starten Sie den Server neu:

```bash
npm run dev
```

Die CRM-Anwendung sollte jetzt funktionieren!
