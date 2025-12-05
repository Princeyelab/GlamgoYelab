/**
 * Corrige les problèmes d'encodage UTF-8 dans les textes
 */
export function fixEncoding(text) {
  if (!text) return text;

  // Mapping des caractères mal encodés
  const fixes = {
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ãª': 'ê',
    'Ã«': 'ë',
    'Ã ': 'à',
    'Ã¢': 'â',
    'Ã¤': 'ä',
    'Ã¯': 'ï',
    'Ã®': 'î',
    'Ã´': 'ô',
    'Ã¶': 'ö',
    'Ã¹': 'ù',
    'Ã»': 'û',
    'Ã¼': 'ü',
    'Ã§': 'ç',
    'Å"': 'œ',
    'Ã‰': 'É',
    'Ãˆ': 'È',
    'ÃŠ': 'Ê',
    'Ã€': 'À',
    'Ã‚': 'Â',
    'Ã"': 'Ô',
    'Ã™': 'Ù',
    'Ã›': 'Û',
    'Ã‡': 'Ç',
    'â€™': "'",
    'â€"': '–',
    'â€"': '—',
  };

  let fixed = text;
  for (const [bad, good] of Object.entries(fixes)) {
    fixed = fixed.replace(new RegExp(bad, 'g'), good);
  }

  return fixed;
}
