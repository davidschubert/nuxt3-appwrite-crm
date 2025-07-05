// Manual check script for server/api/contacts.post.js error handling
async function test() {
    let contacts;
    try {
        // simulate readBody throwing
        throw new Error('Read body failed');
    } catch (error) {
        console.error('Fehler beim Upserten der Kontakte:', error);
        const documents = Array.isArray(contacts)
            ? contacts.map((contact) => ({
                  ...contact,
                  $id: contact.$id || `demo-${Date.now()}`,
              }))
            : [];
        console.log('documents length:', documents.length);
    }
}

await test();
