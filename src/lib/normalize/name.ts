import { FieldStatus } from '../compare/types';

const HONORIFICS = new Set([
  'shri',
  'shree',
  'smt',
  'shrimati',
  'mr',
  'mrs',
  'ms',
  'dr',
  'master',
  'km', // Kumari
  'kumari',
]);

/**
 * Normalizes name by trimming, lowercasing, stripping honorifics and punctuation.
 * Returns array of lowercase clean tokens.
 */
export function normalizeNameTokens(rawInput: string | null): string[] {
  if (!rawInput || !rawInput.trim()) {
    return [];
  }

  // Remove periods, commas, dashes
  const clean = rawInput
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
 * Evaluates two names according to the Name Matching Rules Table in spec.md
 */
export function compareNames(nameA: string | null, nameB: string | null): NameComparisonResult {
  const tokensA = normalizeNameTokens(nameA);
  const tokensB = normalizeNameTokens(nameB);

  // Missing or empty
  if (tokensA.length === 0 || tokensB.length === 0) {
    return {
      status: 'Needs Review',
      reason: 'Name was missing or unreadable on one document',
    };
  }

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

  // Identical sequence
  if (tokensA.join(' ') === tokensB.join(' ')) {
    return {
      status: 'Consistent',
      reason: 'Exact name match across documents',
    };
  }

  // Reordered identical token set (e.g. "Sharma Suresh" vs "Suresh Sharma")
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  if (tokensA.length === tokensB.length && tokensA.every((t) => setB.has(t))) {
    return {
      status: 'Needs Review',
      reason: 'Possible match, but name tokens appear in reordered format',
    };
  }

  // Initials matching (e.g., "S. Sharma" vs "Suresh Sharma")
  const isInitialMatch = checkInitials(tokensA, tokensB) || checkInitials(tokensB, tokensA);
  if (isInitialMatch) {
    return {
      status: 'Needs Review',
      reason: 'Possible match with initials or abbreviation',
    };
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
    reason: `Different names ("${tokensA.join(' ')}" vs "${tokensB.join(' ')}")`,
  };
}

function checkInitials(tokensA: string[], tokensB: string[]): boolean {
  if (tokensA.length !== tokensB.length) {
    // Also support when one has 2 tokens (initial + surname) and other has 3 tokens (first + middle + surname)
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
