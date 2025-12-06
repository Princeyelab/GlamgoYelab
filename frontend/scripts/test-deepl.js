// Test DeepL API
const DEEPL_API_KEY = '4274f47f-77b2-4358-ab8b-53c99ca149ca:fx';
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

async function testDeepL() {
  console.log('Testing DeepL API...');

  try {
    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: ['Nettoyage complet de votre domicile'],
        target_lang: 'AR',
      }),
    });

    console.log('Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Success!');
    console.log('Translation:', data.translations[0].text);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDeepL();
