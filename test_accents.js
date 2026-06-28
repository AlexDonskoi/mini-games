const SYLLABLE_GROUPS = [
  { key: 'b',  syllables: ['ba', 'be', 'bi', 'bo', 'bu'] },
  { key: 'c',  syllables: ['ca', 'ce', 'ci', 'co', 'cu'] },
  { key: 'd',  syllables: ['da', 'de', 'di', 'do', 'du'] },
  { key: 'f',  syllables: ['fa', 'fe', 'fi', 'fo', 'fu'] },
  { key: 'g',  syllables: ['ga', 'ge', 'gi', 'go', 'gu'] },
  { key: 'j',  syllables: ['ja', 'je', 'ji', 'jo', 'ju'] },
  { key: 'l',  syllables: ['la', 'le', 'li', 'lo', 'lu'] },
  { key: 'm',  syllables: ['ma', 'me', 'mi', 'mo', 'mu'] },
  { key: 'n',  syllables: ['na', 'ne', 'ni', 'no', 'nu'] },
  { key: 'ñ',  syllables: ['ña', 'ñe', 'ñi', 'ño', 'ñu'] },
  { key: 'p',  syllables: ['pa', 'pe', 'pi', 'po', 'pu'] },
  { key: 'r',  syllables: ['ra', 're', 'ri', 'ro', 'ru'] },
  { key: 's',  syllables: ['sa', 'se', 'si', 'so', 'su'] },
  { key: 't',  syllables: ['ta', 'te', 'ti', 'to', 'tu'] },
  { key: 'v',  syllables: ['va', 've', 'vi', 'vo', 'vu'] },
  { key: 'ch', syllables: ['cha', 'che', 'chi', 'cho', 'chu'] },
  { key: 'll', syllables: ['lla', 'lle', 'llo', 'llu'] },
  { key: 'y',  syllables: ['ya', 'ye', 'yo', 'yu'] },
  { key: 'z',  syllables: ['za', 'ze', 'zo', 'zu'] },
  { key: '_n', syllables: ['an', 'en', 'in', 'on', 'un'] },
  { key: '_r', syllables: ['ar', 'er', 'ir', 'or', 'ur'] },
  { key: '_l', syllables: ['al', 'el', 'ol'] },
  { key: '_s', syllables: ['as', 'es', 'os'] },
];

const accents = { 'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú' };

let allSpoken = [];
SYLLABLE_GROUPS.forEach(g => {
  g.syllables.forEach(s => {
    let spokenText = s;
    spokenText = spokenText.replace(/^ll/, 'y');
    if (spokenText === 'ze') spokenText = 'ce';
    spokenText = spokenText.replace(/[aeiou]/, v => accents[v]);
    allSpoken.push(`${s} -> ${spokenText}`);
  });
});

console.log(allSpoken.join('\n'));
