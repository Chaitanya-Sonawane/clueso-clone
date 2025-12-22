'use client';

import { useState, useEffect } from 'react';

interface AIReview {
    id: string;
    demoId: string;
    reviewType: string;
    overallScore: number;
    insights: string[];
    commonIssues: string[];
    translationWarnings: string[];
    recommendations: string[];
    publishReadiness: 'ready' | 'needs_work' | 'major_issues';
    createdAt: string;
    metadata?: any;
}

interface AIReviewPanelProps {
    sessionId: string;
    onClose: () => void;
}

export default function AIReviewPanel({ sessionId, onClose }: AIReviewPanelProps) {
    const [aiReview, setAIReview] = useState<AIReview | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadExistingReview();
    }, [sessionId]);

    const loadExistingReview = async () => {
        try {
            const response = await fetch(`/api/collaboration/demos/${sessionId}/ai-review`);
            const data = await response.json();
            
            if (data.success) {
                setAIReview(data.data);
            }
        } catch (error) {
            console.error('Failed to load existing review:', error);
        }
    };

    const generateNewReview = async () => {
        setIsGenerating(true);
        setError(null);
        
        try {
            const response = await fetch(`/api/collaboration/demos/${sessionId}/ai-review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewType: 'pre_publish'
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setAIReview(data.data);
            } else {
                setError(data.message || 'Failed to generate review');
            }
        } catch (error) {
            setError('Failed to generate AI review');
            console.error('AI review generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-500';
        if (score >= 6) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreBackground = (score: number) => {
        if (score >= 8) return 'bg-green-100 dark:bg-green-900/20';
        if (score >= 6) return 'bg-yellow-100 dark:bg-yellow-900/20';
        return 'bg-red-100 dark:bg-red-900/20';
    };

    const getReadinessIcon = (readiness: string) => {
        switch (readiness) {
            case 'ready': return '✅';
            case 'needs_work': return '⚠️';
            case 'major_issues': return '❌';
            default: return '❓';
        }
    };

    const getReadinessText = (readiness: string) => {
        switch (readiness) {
            case 'ready': return 'Ready to Publish';
            case 'needs_work': return 'Needs Minor Work';
            case 'major_issues': return 'Major Issues Found';
            default: return 'Unknown Status';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-bg-primary)] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-[var(--color-border-primary)] flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                            🤖 AI Demo Review
                        </h2>
                        <p className="text-[var(--color-text-tertiary)] mt-1">
                            Comprehensive analysis and recommendations
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={generateNewReview}
                            disabled={isGenerating}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    🔄 Generate Review
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                <span>❌</span>
                                <span className="font-medium">Error</span>
                            </div>
                            <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
                        </div>
                    )}

                    {!aiReview && !isGenerating && !error && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🤖</div>
                            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                                No AI Review Available
                            </h3>
                            <p className="text-[var(--color-text-tertiary)] mb-6">
                                Generate an AI-powered review to get insights and recommendations for your demo.
                            </p>
                            <button
                                onClick={generateNewReview}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Generate AI Review
                            </button>
                        </div>
                    )}

                    {aiReview && (
                        <div className="space-y-6">
                            {/* Overall Score */}
                            <div className={`p-6 rounded-lg ${getScoreBackground(aiReview.overallScore)}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                                        Overall Quality Score
                                    </h3>
                                    <div className={`text-3xl font-bold ${getScoreColor(aiReview.overallScore)}`}>
                                        {aiReview.overallScore.toFixed(1)}/10
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{getReadinessIcon(aiReview.publishReadiness)}</span>
                                    <span className="font-medium text-[var(--color-text-primary)]">
                                        {getReadinessText(aiReview.publishReadiness)}
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
                                    Generated on {formatDate(aiReview.createdAt)}
                                </p>
                            </div>

                            {/* Key Insights */}
                            {aiReview.insights.length > 0 && (
                                <div className="bg-[var(--color-bg-secondary)] p-6 rounded-lg">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                                        <span>💡</span> Key Insights
                                    </h3>
                                    <ul className="space-y-2">
                                        {aiReview.insights.map((insight, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <span className="text-blue-500 mt-1">•</span>
                                                <span className="text-[var(--color-text-secondary)]">{insight}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Common Issues */}
                            {aiReview.commonIssues.length > 0 && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                                        <span>⚠️</span> Common Issues
                                    </h3>
                                    <ul className="space-y-2">
                                        {aiReview.commonIssues.map((issue, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <span className="text-yellow-600 mt-1">▲</span>
                                                <span className="text-[var(--color-text-secondary)]">{issue}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Translation Warnings */}
                            {aiReview.translationWarnings.length > 0 && (
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                                        <span>🌍</span> Translation Warnings
                                    </h3>
                                    <ul className="space-y-2">
                                        {aiReview.translationWarnings.map((warning, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <span className="text-orange-600 mt-1">⚡</span>
                                                <span className="text-[var(--color-text-secondary)]">{warning}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Recommendations */}
                            {aiReview.recommendations.length > 0 && (
                                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                                        <span>🎯</span> Recommendations
                                    </h3>
                                    <ul className="space-y-3">
                                        {aiReview.recommendations.map((recommendation, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <span className="text-green-600 mt-1">✓</span>
                                                <span className="text-[var(--color-text-secondary)]">{recommendation}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4 border-t border-[var(--color-border-primary)]">
                                <button
                                    onClick={generateNewReview}
                                    disabled={isGenerating}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                >
                                    🔄 Refresh Review
                                </button>
                                <button
                                    onClick={() => {
                                        // Export review functionality could be added here
                                        const reviewData = JSON.stringify(aiReview, null, 2);
                                        const blob = new Blob([reviewData], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `ai-review-${sessionId}.json`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    📄 Export Review
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}