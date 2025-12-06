import { NextResponse } from 'next/server';

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

export async function POST(request) {
  try {
    const { texts, targetLang } = await request.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: 'texts array required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_DEEPL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'DeepL API key not configured' }, { status: 500 });
    }

    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: texts,
        target_lang: targetLang || 'AR',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepL API error:', response.status, errorText);
      return NextResponse.json({ error: 'DeepL API error', details: errorText }, { status: response.status });
    }

    const data = await response.json();
    const translations = data.translations?.map(t => t.text) || texts;

    return NextResponse.json({ translations });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
