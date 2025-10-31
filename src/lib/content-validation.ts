import { ProfanityFilter } from 'glin-profanity';

/**
 * Content Validation Utilities
 * Provides validation for inappropriate content and URLs in user inputs
 */
const filter = new ProfanityFilter({
    languages: ['english', 'french', 'german'],
    caseSensitive: false, // Case insensitive for better detection
    customWords: [
        // Dutch profanity words list from AI generated
        // General curses
        'kanker', 'kankeren', 'tering', 'tyfus', 'pleuris', 'pokke', 'klote', 'verdomme', 'godverdomme',
        'godver', 'godverdegodver', 'gvd', 'jezus', 'jezusmina', 'allemachtig', 'potverdomme', 'potverdorie',
        'verdekke', 'verdikke', 'verdomd', 'damn', 'fuck', 'shit', 'wtf',

        // Sexual / explicit
        'kut', 'kutwijf', 'kuttekop', 'kutkind', 'kutzooi', 'kutleven',
        'neuken', 'neuk', 'neuker', 'geneukt', 'naaien', 'genaaid', 'pijpen', 'afzuigen',
        'beffen', 'likken', 'ballenlikker', 'slet', 'trut', 'teef', 'bitch', 'hoer', 'hoertje',
        'slettenbak', 'sletwijf', 'hoerenzoon', 'hoerenkind', 'hoerenjong', 'hoerenwijf',
        'hoerentoeter', 'viezerik', 'viespeuk', 'geil', 'natte', 'flikker', 'homo', 'mietje',
        'lul', 'lullen', 'lulletje', 'lulzak', 'lullo', 'pikkel', 'pik', 'piemel', 'flamoes', 'reet',
        'kont', 'reetzak', 'stront', 'strontzak', 'scheet', 'poep', 'poepchinees', 'poepneger',
        'anus', 'billenlikker',

        // Insults / mild slurs
        'eikel', 'debiel', 'mongool', 'idioot', 'dwaas', 'sukkel', 'loser', 'domkop', 'hersenloze',
        'idioot', 'gek', 'malloot', 'prutser', 'kluns', 'lulhannes', 'smeerlap', 'zak', 'klootzak',
        'kloot', 'klojo', 'kloothommel', 'kloefkapper', 'kletskop', 'kakkenest', 'stommerik',
        'rotzak', 'vuilaard', 'vuile', 'vuilniszak', 'rotvent', 'kakkenbak', 'etter', 'etterbak',
        'ettertje', 'klapkut', 'knuppel', 'drol', 'debielenkop', 'nutteloze', 'hufter', 'eikelzak',
        'randdebiel', 'lomperik', 'onnozelaar', 'smeerlap', 'hondsvot', 'lompe', 'luldebehanger',

        // Flemish / Belgian regional swears
        'verdomme', 'verdikke', 'verdekke', 'verdorie', 'allemachtig', 'allez', 'mannekes',
        'gijle', 'zakkenvuller', 'zagevent', 'zagewijf', 'zeveraar', 'zeverzak', 'tetterwijf',
        'ambetanterik', 'ambetant', 'pipo', 'seut', 'lozer', 'klapzoen', 'lomperd', 'tetteraar',
        'onnozel', 'onnozelaar', 'bleiter', 'kleuter', 'snotneus', 'snotjong', 'janet', 'wijveke',
        'wijf', 'ventje', 'schaap', 'varken', 'ezel', 'lullo', 'vuiligheid', 'brol', 'kak', 'kakken',
        'kakzak', 'kakvent', 'kakkebroek', 'strontvent', 'plezante', 'lomperik', 'schaamtekind',
        'gijle zot', 'koekwous',

        // Racist or strongly offensive (for filtering!)
        'neger', 'poepchinees', 'jood', 'zwarte', 'aap', 'kaaskop', 'buitenlander', 'turk', 'mocro',
        'vuile turk', 'vuile mocro', 'vuile aap', 'kutbelg', 'kutnederlander',
    ]
});

// URL detection regex - matches http/https/www URLs
const URL_REGEX = /\b(?:https?:\/\/|www\.)\S+\b/gi;

/**
 * Check if text contains bad words
 */
export function containsBadWords(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    const trimmedText = text.trim();
    if (!trimmedText) return false;
    return filter.isProfane(trimmedText);
}

/**
 * Check if text contains URLs
 */
export function containsUrls(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    const trimmedText = text.trim();
    if (!trimmedText) return false;
    return URL_REGEX.test(trimmedText);
}

/**
 * Validate content for both bad words and URLs
 * Returns an object with validation results
 */
export function validateContent(text: string): {
    isValid: boolean;
    hasBadWords: boolean;
    hasUrls: boolean;
    errors: string[];
} {
    const errors: string[] = [];
    let hasBadWords = false;
    let hasUrls = false;

    if (text && typeof text === 'string') {
        const trimmedText = text.trim();
        if (trimmedText) {
            hasBadWords = containsBadWords(trimmedText);
            hasUrls = containsUrls(trimmedText);

            if (hasBadWords) {
                errors.push('contentContainsBadWords');
            }
            if (hasUrls) {
                errors.push('contentContainsUrls');
            }
        }
    }

    return {
        isValid: errors.length === 0,
        hasBadWords,
        hasUrls,
        errors,
    };
}
