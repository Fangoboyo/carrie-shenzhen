import fs from 'fs';
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
  try {
    await pb.admins.authWithPassword('admin@example.com', 'Password123!');
    console.log('Logged in as admin.');

    // Configure Google Auth
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    
    if (!clientId || !clientSecret) {
      console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env file');
      return;
    }

    // Configure Google Auth via users collection
    try {
      const usersCol = await pb.collections.getOne('users');
      if (!usersCol.oauth2) usersCol.oauth2 = {};
      usersCol.oauth2.enabled = true;
      usersCol.oauth2.providers = usersCol.oauth2.providers || [];
      const googleProvider = usersCol.oauth2.providers.find(p => p.name === 'google');
      if (googleProvider) {
          googleProvider.clientId = clientId;
          googleProvider.clientSecret = clientSecret;
          // Clear any empty URLs so pocketbase uses the defaults
          delete googleProvider.authUrl;
          delete googleProvider.tokenUrl;
          delete googleProvider.userApiUrl;
      } else {
          usersCol.oauth2.providers.push({
              name: 'google',
              clientId: clientId,
              clientSecret: clientSecret,
          });
      }
      await pb.collections.update('users', usersCol);
      console.log('Google Auth configured via Users collection.');
    } catch (err) {
      console.log('Failed to configure Google Auth on users collection:', err.message);
    }

    // Clean up existing collections to apply new v0.23+ fields schema
    try {
      console.log('Cleaning up existing collections...');
      try {
        await pb.collections.delete('boards');
      } catch (e) {}
      try {
        await pb.collections.delete('videos');
      } catch (e) {}
    } catch (err) {
      console.log('Cleanup error:', err.message);
    }

    // Create Videos Collection
    try {
      const usersCol = await pb.collections.getOne('users');
      await pb.collections.create({
        name: 'videos',
        type: 'base',
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'youtubeId', type: 'text', required: true },
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1
          },
          { name: 'created', type: 'autodate', onCreate: true },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
        ],
        listRule: '',
        viewRule: '',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      });
      console.log('Created videos collection.');
    } catch (err) {
      console.log('Failed to create videos collection:', err.data || err.message);
    }

    // Create Boards Collection
    try {
      const usersCol = await pb.collections.getOne('users');
      const videosCol = await pb.collections.getOne('videos');
      await pb.collections.create({
        name: 'boards',
        type: 'base',
        fields: [
          { name: 'name', type: 'text', required: true },
          {
            name: 'owner',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1
          },
          {
            name: 'videos',
            type: 'relation',
            collectionId: videosCol.id,
            cascadeDelete: false,
            maxSelect: null
          },
          { name: 'created', type: 'autodate', onCreate: true },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
        ],
        listRule: '',
        viewRule: '',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      });
      console.log('Created boards collection.');
    } catch (err) {
      console.log('Failed to create boards collection:', err.data || err.message);
    }

    console.log('Setup complete!');
  } catch (err) {
    console.error('Setup failed:', err);
  }
}

main();
