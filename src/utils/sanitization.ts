// Input sanitization utilities for security
import DOMPurify from 'dompurify';

// Maximum lengths for different input types
const MAX_LENGTHS = {
    title: 200,
    message: 2000,
    authorNickname: 50,
    videoUrl: 500,
    password: 100,
    note: 10,
};

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'];

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
    image: 5 * 1024 * 1024, // 5MB
    video: 50 * 1024 * 1024, // 50MB
    audio: 10 * 1024 * 1024, // 10MB
};

export class InputSanitizer {
    /**
     * Sanitize text input to prevent XSS
     */
    static sanitizeText(input: string, maxLength?: number): string {
        if (!input || typeof input !== 'string') {
            return '';
        }

        // Remove null bytes and control characters (but keep spaces)
        let sanitized = input.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');

        // Apply length limit
        if (maxLength && sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        return sanitized;
    }

    /**
     * Sanitize HTML content using DOMPurify
     */
    static sanitizeHTML(html: string): string {
        if (!html || typeof html !== 'string') {
            return '';
        }

        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
            ALLOWED_ATTR: ['href', 'target'],
        });
    }

    /**
     * Validate and sanitize URL
     */
    static sanitizeURL(url: string): string {
        if (!url || typeof url !== 'string') {
            return '';
        }

        const sanitized = this.sanitizeText(url, MAX_LENGTHS.videoUrl);

        try {
            const urlObj = new URL(sanitized);
            // Only allow http, https protocols
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return '';
            }
            return sanitized;
        } catch {
            return '';
        }
    }

    /**
     * Validate YouTube URL format
     */
    static validateYouTubeURL(url: string): boolean {
        if (!url) return false;

        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        return youtubeRegex.test(url);
    }

    /**
     * Validate piano note format
     */
    static validatePianoNote(note: string): boolean {
        if (!note || typeof note !== 'string') {
            return false;
        }

        // Piano note format: letter + optional sharp/flat + octave number
        const noteRegex = /^[A-G][#b]?\d$/;
        return noteRegex.test(note);
    }

    /**
     * Validate file type and size
     */
    static validateFile(file: File, type: 'image' | 'video' | 'audio'): { valid: boolean; error?: string } {
        if (!file) {
            return { valid: false, error: 'No file provided' };
        }

        // Check file type
        let allowedTypes: string[];
        let maxSize: number;

        switch (type) {
            case 'image':
                allowedTypes = ALLOWED_IMAGE_TYPES;
                maxSize = MAX_FILE_SIZES.image;
                break;
            case 'video':
                allowedTypes = ALLOWED_VIDEO_TYPES;
                maxSize = MAX_FILE_SIZES.video;
                break;
            case 'audio':
                allowedTypes = ALLOWED_AUDIO_TYPES;
                maxSize = MAX_FILE_SIZES.audio;
                break;
            default:
                return { valid: false, error: 'Invalid file type' };
        }

        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
            };
        }

        if (file.size > maxSize) {
            const maxSizeMB = maxSize / (1024 * 1024);
            return {
                valid: false,
                error: `File too large. Maximum size: ${maxSizeMB}MB`
            };
        }

        return { valid: true };
    }

    /**
     * Sanitize form data object
     */
    static sanitizeFormData(data: Record<string, any>): Record<string, any> {
        const sanitized: Record<string, any> = {};

        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                const maxLength = MAX_LENGTHS[key as keyof typeof MAX_LENGTHS];
                sanitized[key] = this.sanitizeText(value, maxLength);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * Validate password strength
     */
    static validatePassword(password: string): { valid: boolean; error?: string } {
        if (!password || typeof password !== 'string') {
            return { valid: false, error: 'Password is required' };
        }

        if (password.length < 6) {
            return { valid: false, error: 'Password must be at least 6 characters long' };
        }

        if (password.length > MAX_LENGTHS.password) {
            return { valid: false, error: `Password must be no more than ${MAX_LENGTHS.password} characters` };
        }

        return { valid: true };
    }

    /**
     * Escape special characters for safe display
     */
    static escapeHTML(text: string): string {
        if (!text || typeof text !== 'string') {
            return '';
        }

        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }
}

// Export constants for use in components
export { MAX_LENGTHS, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, ALLOWED_AUDIO_TYPES, MAX_FILE_SIZES }; 