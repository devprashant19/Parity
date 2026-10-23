import { FieldStatus } from '../compare/types';

const HONORIFICS = new Set([
  'mr',
  'mrs',
  'ms',
  'miss',
  'dr',
  'prof',
  'sir',
  'dame',
  'rev',
  'lord',
  'lady',
  'mx',
  'master',
  'shri',
  'shree',
  'smt',
  'shrimati',
  'km',
  'kumari',
]);

const PARTICLES = new Set([
  'de',
  'del',
  'della',
  'der',
  'di',
  'da',
  'do',
  'dos',
  'das',
  'du',
  'van',
  'von',
  'den',
  'ter',
  'la',
  'le',
  'al',
  'el',
  'bin',
  'bint',
  'ibn',
]);

/**
 * Strips diacritical accents / marks (e.g. José -> Jose, Müller -> Muller)
 */
export function foldAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalizes name string into basic lowercase tokens (preserving accent info).
 */
export function extractRawTokens(rawInput: string | null): string[] {
  if (!rawInput || !rawInput.trim()) return [];
  return rawInput
    .toLowerCase()
    .replace(/[\.\,\_\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/**
 * Normalizes name by trimming, lowercasing, folding accents and stripping honorifics and punctuation.
 * Returns array of lowercase clean tokens.
 */
export function normalizeNameTokens(rawInput: string | null): string[] {
  if (!rawInput || !rawInput.trim()) {
    return [];
  }

  const clean = foldAccents(rawInput)
    .toLowerCase()
    .replace(/[\.\,\-\_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = clean.split(' ').filter(Boolean);

  // Filter out leading honorifics
  return tokens.filter((t, idx) => {
    if (idx === 0 && HONORIFICS.has(t)) {
      return false;
    }
    return true;
  });
}

export interface NameComparisonResult {
  status: FieldStatus;
  reason: string;
}

/**
 * Evaluates two names according to international and locale-aware rules:
 * - Exact match -> Consistent
 * - Honorific detected -> Needs Review
 * - Accent folding variation ("José" vs "Jose") -> Needs Review
 * - Middle initial or omission ("Maria J. Alvarez" vs "Maria Alvarez") -> Needs Review
 * - Hyphenated / double surname variation -> Needs Review
 * - Particles ("van", "de", "von") -> Needs Review
 * - Family-name-first reordering ("Wang Wei" vs "Wei Wang") -> Needs Review
 * - Unclear / single token -> Needs Review
 * - Different names -> Conflict
 */
export function compareNames(nameA: string | null, nameB: string | null): NameComparisonResult {
  if (!nameA || !nameB || !nameA.trim() || !nameB.trim()) {
    return {
      status: 'Needs Review',
      reason: 'Name was missing or unreadable on one document',
    };
  }

  const rawTokensA = extractRawTokens(nameA);
  const rawTokensB = extractRawTokens(nameB);

  // 1. Check for honorifics in raw tokens
  const hasHonorificA = HONORIFICS.has(rawTokensA[0]);
  const hasHonorificB = HONORIFICS.has(rawTokensB[0]);
  const strippedA = hasHonorificA ? rawTokensA.slice(1) : rawTokensA;
  const strippedB = hasHonorificB ? rawTokensB.slice(1) : rawTokensB;

  if (hasHonorificA !== hasHonorificB) {
    const foldedStrippedA = strippedA.map(foldAccents).join(' ');
    const foldedStrippedB = strippedB.map(foldAccents).join(' ');
    if (foldedStrippedA === foldedStrippedB) {
      const hon = hasHonorificA ? rawTokensA[0] : rawTokensB[0];
      return {
        status: 'Needs Review',
        reason: `Honorific detected ("${hon}") - requires review to verify identity.`,
      };
    }
  }

  // 2. Check exact raw string match (preserving accents, casing ignored)
  if (strippedA.join(' ') === strippedB.join(' ')) {
    return {
      status: 'Consistent',
      reason: 'Exact name match across documents',
    };
  }

  // 3. Check accent folding difference (e.g. "José" vs "Jose")
  const foldedA = strippedA.map(foldAccents).join(' ');
  const foldedB = strippedB.map(foldAccents).join(' ');

  if (foldedA === foldedB) {
    return {
      status: 'Needs Review',
      reason: `Accent variant detected ("${nameA.trim()}" vs "${nameB.trim()}") - requires review.`,
    };
  }

  // 4. Handle hyphenated surnames e.g. "Maria Alvarez-Gomez" vs "Maria Alvarez"
  const cleanWithHyphensA = nameA.toLowerCase().replace(/[\.\,]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanWithHyphensB = nameB.toLowerCase().replace(/[\.\,]/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleanWithHyphensA.includes('-') || cleanWithHyphensB.includes('-')) {
    const baseA = foldAccents(cleanWithHyphensA).replace(/\-/g, ' ');
    const baseB = foldAccents(cleanWithHyphensB).replace(/\-/g, ' ');
    const wordsA = baseA.split(' ').filter(Boolean);
    const wordsB = baseB.split(' ').filter(Boolean);
    if (wordsA[0] === wordsB[0] && (wordsA.includes(wordsB[wordsB.length - 1]) || wordsB.includes(wordsA[wordsA.length - 1]))) {
      return {
        status: 'Needs Review',
        reason: `Hyphenated or compound surname variation detected ("${nameA.trim()}" vs "${nameB.trim()}").`,
      };
    }
  }

  const tokensA = normalizeNameTokens(nameA);
  const tokensB = normalizeNameTokens(nameB);

  // Single token
  if (tokensA.length === 1 || tokensB.length === 1) {
    const single = tokensA.length === 1 ? tokensA[0] : tokensB[0];
    const multi = tokensA.length === 1 ? tokensB : tokensA;

    if (multi.includes(single)) {
      return {
        status: 'Needs Review',
        reason: 'Possible match, but one document only has a single name token',
      };
    }
    return {
      status: 'Conflict',
      reason: 'Single name token does not match other document',
    };
  }

  // 5. Particles (e.g., "Ludwig van Beethoven" vs "Ludwig Beethoven")
  const noParticlesA = tokensA.filter((t) => !PARTICLES.has(t));
  const noParticlesB = tokensB.filter((t) => !PARTICLES.has(t));
  if (tokensA.some((t) => PARTICLES.has(t)) || tokensB.some((t) => PARTICLES.has(t))) {
    if (noParticlesA.join(' ') === noParticlesB.join(' ')) {
      return {
        status: 'Needs Review',
        reason: `Surname particle variation detected across documents ("${nameA.trim()}" vs "${nameB.trim()}").`,
      };
    }
  }

  // 6. Middle initials / name omissions (e.g. "Maria J. Alvarez" vs "Maria Alvarez")
  if (
    tokensA[0] === tokensB[0] &&
    tokensA[tokensA.length - 1] === tokensB[tokensB.length - 1]
  ) {
    if (tokensA.length !== tokensB.length) {
      return {
        status: 'Needs Review',
        reason: `Middle initial or name omitted ("${nameA.trim()}" vs "${nameB.trim()}").`,
      };
    }
  }

  // 7. Reordered tokens (family-name-first, e.g. "Wang Wei" vs "Wei Wang")
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  if (tokensA.length === tokensB.length && tokensA.every((t) => setB.has(t))) {
    return {
      status: 'Needs Review',
      reason: 'Family-name-first or reordered name format detected across documents.',
    };
  }

  // 8. Initials matching (e.g., "S. Sharma" vs "Suresh Sharma")
  const isInitialMatch = checkInitials(tokensA, tokensB) || checkInitials(tokensB, tokensA);
  if (isInitialMatch) {
    return {
      status: 'Needs Review',
      reason: 'Name abbreviation or initial variation (possible match with initials)',
    };
  }

  // 8. Compound / double surnames (e.g., "Gabriel García Márquez" vs "Gabriel García")
  const [shorter, longer, origShort, origLong] =
    tokensA.length < tokensB.length
      ? [tokensA, tokensB, nameA, nameB]
      : [tokensB, tokensA, nameB, nameA];
  if (shorter.length >= 2 && longer.length > shorter.length) {
    const isPrefix = shorter.every((token, idx) => token === longer[idx]);
    if (isPrefix) {
      return {
        status: 'Needs Review',
        reason: `Compound or maternal surname omitted on one document ("${origShort.trim()}" vs "${origLong.trim()}").`,
      };
    }
  }

  // Check surname (last token) vs given name (earlier tokens)
  const surnameA = tokensA[tokensA.length - 1];
  const surnameB = tokensB[tokensB.length - 1];

  if (surnameA === surnameB) {
    return {
      status: 'Conflict',
      reason: `Same surname ("${surnameA}") but Conflicting given names`,
    };
  }

  return {
    status: 'Conflict',
    reason: `Different names ("${nameA.trim()}" vs "${nameB.trim()}")`,
  };
}

function checkInitials(tokensA: string[], tokensB: string[]): boolean {
  if (tokensA.length !== tokensB.length) {
    if (tokensA.length === 2 && tokensB.length >= 2) {
      const surnameA = tokensA[tokensA.length - 1];
      const surnameB = tokensB[tokensB.length - 1];
      if (surnameA === surnameB && tokensA[0].length === 1 && tokensB[0].startsWith(tokensA[0])) {
        return true;
      }
    }
    return false;
  }

  let hasInitial = false;
  let matches = true;

  for (let i = 0; i < tokensA.length; i++) {
    const tA = tokensA[i];
    const tB = tokensB[i];

    if (tA === tB) {
      continue;
    }

    if (tA.length === 1 && tB.startsWith(tA)) {
      hasInitial = true;
      continue;
    }

    matches = false;
    break;
  }

  return matches && hasInitial;
}
