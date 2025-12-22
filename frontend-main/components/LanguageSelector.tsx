'use client';

import { useState, useEffect } from 'react';

interface Language {
    language: string;
    translatedTitle?: string;
    translationQuality?: number;
    isDefault: boolean;
}

interface Subtitle {
    start: number;
    end: number;
    text: string;
}

interface LanguageSelectorProps {
    sessionId: string;
    currentLanguage: string;
    onLanguageChange: (language: string, subtitles: Subtitle[]) => void;
    onAddLanguage?: (language: string) => void;
}

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
];

export default function LanguageSelector({ 
    sessionId, 
    currentLanguage, 
    onLanguageChange,
    onAddLanguage 
}: LanguageSelectorProps) {
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddLanguage, setShowAddLanguage] = useState(false);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    useEffect(() => {
        loadAvailableLanguages();
    }, [sessionId]);

    const loadAvailableLanguages = async () => {
        try {
            const response = await fetch(`/api/collaboration/demos/${sessionId}/languages`);
            const data = await response.json();
            
            if (data.success) {
                setAvailableLanguages(data.data);
            }
        } catch (error) {
            console.error('Failed to load languages:', error);
        }
    };

    const handleLanguageChange = async (language: string) => {
        if (language === currentLanguage) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/collaboration/demos/${sessionId}/languages/${language}/subtitles`);
            const data = await response.json();
            
            if (data.success) {
                onLanguageChange(language, data.data.subtitles || []);
            }
        } catch (error) {
            console.error('Failed to load subtitles:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateLanguageSupport = async (language: string) => {
        setIsGenerating(language);
        try {
            const response = await fetch(`/api/collaboration/demos/${sessionId}/languages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language,
                    originalTranscript: 'Demo transcript here' // This would come from your demo data
                })
            });

            const data = await response.json();
            if (data.success) {
                await loadAvailableLanguages();
                setShowAddLanguage(false);
                onAddLanguage?.(language);
            }
        } catch (error) {
            console.error('Failed to generate language support:', error);
        } finally {
            setIsGenerating(null);
        }
    };

    const getLanguageInfo = (code: string) => {
        return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || 
               { code, name: code.toUpperCase(), flag: '🌐' };
    };

    const getQualityColor = (quality?: number) => {
        if (!quality) return 'text-gray-400';
        if (quality >= 0.9) return 'text-green-500';
        if (quality >= 0.7) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getQualityText = (quality?: number) => {
        if (!quality) return 'Unknown';
        if (quality >= 0.9) return 'Excellent';
        if (quality >= 0.7) return 'Good';
        return 'Needs Review';
    };

    return (
        <div className="relative">
            {/* Current Language Display */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)]">
                <span className="text-lg">{getLanguageInfo(currentLanguage).flag}</span>
                <span className="font-medium text-[var(--color-text-primary)]">
                    {getLanguageInfo(currentLanguage).name}
                </span>
                {isLoading && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
            </div>

            {/* Language Dropdown */}
            <div className="absolute top-full left-0 mt-2 w-64 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {/* Available Languages */}
                <div className="p-2">
                    <div className="text-xs font-semibold text-[var(--color-text-tertiary)] mb-2 px-2">
                        Available Languages
                    </div>
                    {availableLanguages.map(lang => {
                        const langInfo = getLanguageInfo(lang.language);
                        return (
                            <button
                                key={lang.language}
                                onClick={() => handleLanguageChange(lang.language)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left hover:bg-[var(--color-bg-secondary)] transition-colors ${
                                    currentLanguage === lang.language ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{langInfo.flag}</span>
                                    <div>
                                        <div className="font-medium text-[var(--color-text-primary)]">
                                            {langInfo.name}
                                        </div>
                                        {lang.translatedTitle && (
                                            <div className="text-xs text-[var(--color-text-tertiary)] truncate max-w-32">
                                                {lang.translatedTitle}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {lang.translationQuality && (
                                        <div className={`text-xs ${getQualityColor(lang.translationQuality)}`}>
                                            {getQualityText(lang.translationQuality)}
                                        </div>
                                    )}
                                    {currentLanguage === lang.language && (
                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Add Language Section */}
                <div className="border-t border-[var(--color-border-primary)] p-2">
                    <button
                        onClick={() => setShowAddLanguage(!showAddLanguage)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    >
                        <span>➕</span>
                        <span className="font-medium">Add Language</span>
                    </button>

                    {showAddLanguage && (
                        <div className="mt-2 space-y-1">
                            <div className="text-xs font-semibold text-[var(--color-text-tertiary)] px-2 mb-2">
                                Generate Support For:
                            </div>
                            {SUPPORTED_LANGUAGES
                                .filter(lang => !availableLanguages.some(avail => avail.language === lang.code))
                                .map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => generateLanguageSupport(lang.code)}
                                        disabled={isGenerating === lang.code}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-md text-left hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{lang.flag}</span>
                                            <span className="font-medium text-[var(--color-text-primary)]">
                                                {lang.name}
                                            </span>
                                        </div>
                                        {isGenerating === lang.code && (
                                            <div className="flex items-center gap-2 text-xs text-blue-600">
                                                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                Generating...
                                            </div>
                                        )}
                                    </button>
                                ))
                            }
                        </div>
                    )}
                </div>

                {/* Language Stats */}
                {availableLanguages.length > 1 && (
                    <div className="border-t border-[var(--color-border-primary)] p-3">
                        <div className="text-xs text-[var(--color-text-tertiary)]">
                            🌍 {availableLanguages.length} languages supported
                        </div>
                        <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                            🎯 Global reach enabled
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}