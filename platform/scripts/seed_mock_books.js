import PocketBase from 'pocketbase';
import fs from 'fs';

const pb = new PocketBase('http://127.0.0.1:8090');

const mockBooks = [
  {
    title: 'Summer Memories',
    subtitle: 'Beach & Sunshine 2026',
    coverPath: 'C:\\Users\\bungl\\.gemini\\antigravity-ide\\brain\\de0406fa-028b-4082-a59a-872be6ba2d43\\cover_summer_1781649974224.png',
    coverName: 'cover_summer.png',
    pages: [
      { title: 'Beach Sunset', youtubeId: 'dQw4w9WgXcQ', description: 'Watching the sunset over the horizon.' },
      { title: 'Waves in Slow Motion', youtubeId: 'y6120QOlsfU', description: 'Therapeutic crashing of ocean waves.' },
      { title: 'Sailing Trip', youtubeId: 'L_LUpnjgPso', description: 'Catching the wind on the boat.' }
    ]
  },
  {
    title: 'Travel Journal',
    subtitle: 'Adventures Across Asia',
    coverPath: 'C:\\Users\\bungl\\.gemini\\antigravity-ide\\brain\\de0406fa-028b-4082-a59a-872be6ba2d43\\cover_leather_1781649987273.png',
    coverName: 'cover_leather.png',
    pages: [
      { title: 'Walking in Tokyo', youtubeId: 'FtutLA63Cp8', description: 'Neons and bustle in Shinjuku.' },
      { title: 'Rainy Kyoto Street', youtubeId: '9bZkp7q19f0', description: 'Cozy walk under an umbrella.' }
    ]
  },
  {
    title: 'Daily Doodles',
    subtitle: 'Thoughts and Lo-Fi Beats',
    coverPath: 'C:\\Users\\bungl\\.gemini\\antigravity-ide\\brain\\de0406fa-028b-4082-a59a-872be6ba2d43\\cover_pastel_1781649995260.png',
    coverName: 'cover_pastel.png',
    pages: [
      { title: 'Lo-Fi Beats to Relax', youtubeId: 'kJQP7kiw5Fk', description: 'Chilled background melodies for study.' },
      { title: 'Late Night Coding', youtubeId: 'YxVaT61Q5eg', description: 'Vibe while debugging layout styles.' }
    ]
  },
  {
    title: 'Family Archives',
    subtitle: 'Vintage Home Memories',
    coverPath: 'C:\\Users\\bungl\\.gemini\\antigravity-ide\\brain\\de0406fa-028b-4082-a59a-872be6ba2d43\\cover_mahogany_1781650005733.png',
    coverName: 'cover_mahogany.png',
    pages: [
      { title: "Grandpa's Clock", youtubeId: 'FtutLA63Cp8', description: 'The steady ticking of the old clock.' },
      { title: 'Vintage Home Video', youtubeId: 'dQw4w9WgXcQ', description: 'Nostalgic colors on a VHS tape.' }
    ]
  },
  {
    title: 'Golden Days',
    subtitle: 'Nostalgic Whispers',
    coverPath: 'C:\\Users\\bungl\\.gemini\\antigravity-ide\\brain\\de0406fa-028b-4082-a59a-872be6ba2d43\\cover_floral_1781650016367.png',
    coverName: 'cover_floral.png',
    pages: [
      { title: 'Autumn Walk', youtubeId: 'L_LUpnjgPso', description: 'Walking through crunchy golden leaves.' },
      { title: 'Warm Coffee Cup', youtubeId: 'y6120QOlsfU', description: 'Steam rising in the morning light.' },
      { title: 'Nostalgic Vibe', youtubeId: 'YxVaT61Q5eg', description: 'Cozy moments spent doing nothing.' }
    ]
  }
];

async function main() {
  try {
    await pb.admins.authWithPassword('admin@example.com', 'Password123!');
    console.log('Logged in as PocketBase admin.');

    // 1. Get first user
    const users = await pb.collection('users').getFullList({ requestKey: null });
    if (users.length === 0) {
      console.error('No users found in database. Create a user first.');
      return;
    }
    const ownerId = users[0].id;
    console.log(`Using owner user: ${users[0].email} (${ownerId})`);

    // 2. Clear existing books and pages
    console.log('Clearing existing books and pages...');
    const existingPages = await pb.collection('pages').getFullList({ requestKey: null });
    for (const page of existingPages) {
      await pb.collection('pages').delete(page.id);
    }
    const existingBooks = await pb.collection('books').getFullList({ requestKey: null });
    for (const book of existingBooks) {
      await pb.collection('books').delete(book.id);
    }
    console.log('Collections cleared.');

    // 3. Create mock books and pages
    for (const bookData of mockBooks) {
      console.log(`Creating book: "${bookData.title}"...`);

      const formData = new FormData();
      formData.append('title', bookData.title);
      formData.append('subtitle', bookData.subtitle);
      formData.append('owner', ownerId);

      // Append cover file if exists
      if (fs.existsSync(bookData.coverPath)) {
        const fileBuffer = fs.readFileSync(bookData.coverPath);
        const file = new File([fileBuffer], bookData.coverName, { type: 'image/png' });
        formData.append('cover', file);
      } else {
        console.warn(`Warning: Cover image not found at ${bookData.coverPath}`);
      }

      const bookRecord = await pb.collection('books').create(formData);
      console.log(`Created book "${bookRecord.title}" with ID: ${bookRecord.id}`);

      // Create pages for this book
      for (let i = 0; i < bookData.pages.length; i++) {
        const pageData = bookData.pages[i];
        console.log(`  Creating page: "${pageData.title}"...`);

        const createdPage = await pb.collection('pages').create({
          title: pageData.title,
          youtubeId: pageData.youtubeId,
          description: pageData.description,
          user: ownerId,
          book: bookRecord.id,
          order: i
        });
        console.log(`  Created page with ID: ${createdPage.id}`);
      }
    }

    console.log('Seeding complete! Database is populated.');
  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

main();
