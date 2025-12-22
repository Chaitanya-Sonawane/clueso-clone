'use client';

import { useState, useEffect } from 'react';
import { useCollaborationStore } from '@/lib/collaboration-store';
import { onSocketEvent, offSocketEvent } from '@/lib/socket';

interface CollaborationPanelProps {
  sessionId: string;
  currentTime: number;
  onSeek: (time: number) => void;
  isPlaying: boolean;
}

export default function CollaborationPanel({ 
  sessionId, 
  currentTime, 
  onSeek, 
  isPlaying 
}: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'languages' | 'ai'>('comments');
  const [newComment, setNewComment] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  
  const {
    comments,
    commentsLoading,
    languages,
    languagesLoading,
    aiSuggestions,
    aiSuggestionsLoading,
    aiReview,
    aiReviewLoading,
    addComment,
    resolveComment,
    addLanguage,
    generateAISuggestions,
    generateAIReview,
    fetchComments,
    fetchLanguages,
    fetchAIReview
  } = useCollaborationStore();

  // Listen for real-time collaboration events
  useEffect(() => {
    const handleNewComment = (comment: any) => {
      // Refresh comments when new comment is received
      fetchComments(sessionId);
    };

    const handleCommentResolved = (comment: any) => {
      // Refresh comments when comment is resolved
      fetchComments(sessionId);
    };

    const handleLanguageAdded = (language: any) => {
      // Refresh languages when new language is added
      fetchLanguages(sessionId);
    };

    const handleAISuggestions = (suggestions: any) => {
      // AI suggestions are handled by the store
      console.log('AI suggestions received in panel:', suggestions);
    };

    const handleAIReview = (review: any) => {
      // Refresh AI review when generated
      fetchAIReview(sessionId);
    };

    // Register socket event listeners
    onSocketEvent('new_comment', handleNewComment);
    onSocketEvent('comment_resolved', handleCommentResolved);
    onSocketEvent('language_added', handleLanguageAdded);
    onSocketEvent('ai_suggestions', handleAISuggestions);
    onSocketEvent('ai_review_generated', handleAIReview);

    return () => {
      // Cleanup socket event listeners
      offSocketEvent('new_comment', handleNewComment);
      offSocketEvent('comment_resolved', handleCommentResolved);
      offSocketEvent('language_added', handleLanguageAdded);
      offSocketEvent('ai_suggestions', handleAISuggestions);
      offSocketEvent('ai_review_generated', handleAIReview);
    };
  }, [sessionId, fetchComments, fetchLanguages, fetchAIReview]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await addComment(sessionId, newComment.trim(), currentTime);
    setNewComment('');
  };

  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLanguage.trim()) return;

    await addLanguage(sessionId, newLanguage.trim());
    setNewLanguage('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="h-full bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-primary)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-primary)]">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Collaboration</h2>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-[var(--color-bg-tertiary)] rounded-lg p-1">
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'comments'
                ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Comments
            {comments.length > 0 && (
              <span className="ml-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                {comments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('languages')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'languages'
                ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Languages
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'ai'
                ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            AI
            {aiSuggestions.length > 0 && (
              <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                {aiSuggestions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'comments' && (
          <div className="h-full flex flex-col">
            {/* Add Comment Form */}
            <div className="p-4 border-b border-[var(--color-border-primary)]">
              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment at current time..."
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    At {formatTime(currentTime)}
                  </span>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || commentsLoading}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Comment
                  </button>
                </div>
              </form>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {commentsLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-[var(--color-text-tertiary)]">Loading comments...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-[var(--color-text-tertiary)]">No comments yet</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Add the first comment above</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-lg border ${
                      comment.status === 'resolved'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {comment.aiGenerated && (
                          <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">AI</span>
                        )}
                        <button
                          onClick={() => onSeek(comment.timestamp)}
                          className="text-xs text-purple-400 hover:text-purple-300 font-mono"
                        >
                          {formatTime(comment.timestamp)}
                        </button>
                      </div>
                      {comment.status === 'open' && (
                        <button
                          onClick={() => resolveComment(comment.id)}
                          className="text-xs text-green-400 hover:text-green-300"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                    <p className="text-[var(--color-text-primary)] text-sm mb-2">{comment.comment}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {formatTimestamp(comment.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'languages' && (
          <div className="h-full flex flex-col">
            {/* Add Language Form */}
            <div className="p-4 border-b border-[var(--color-border-primary)]">
              <form onSubmit={handleAddLanguage} className="space-y-3">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Add language (e.g., Spanish, French)"
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={!newLanguage.trim() || languagesLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Language
                </button>
              </form>
            </div>

            {/* Languages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {languagesLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-[var(--color-text-tertiary)]">Loading languages...</p>
                </div>
              ) : languages.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <p className="text-[var(--color-text-tertiary)]">No languages added</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Add language support above</p>
                </div>
              ) : (
                languages.map((language, index) => (
                  <div
                    key={`${language.demoId}-${language.language}-${index}`}
                    className="p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-primary)] font-medium">{language.language}</span>
                      {language.isDefault && (
                        <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Default</span>
                      )}
                    </div>
                    {language.subtitles && (
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Subtitles available</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="h-full flex flex-col">
            {/* AI Actions */}
            <div className="p-4 border-b border-[var(--color-border-primary)] space-y-3">
              <button
                onClick={() => generateAISuggestions(sessionId)}
                disabled={aiSuggestionsLoading}
                className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {aiSuggestionsLoading ? 'Generating...' : 'Generate AI Suggestions'}
              </button>
              <button
                onClick={() => generateAIReview(sessionId)}
                disabled={aiReviewLoading}
                className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {aiReviewLoading ? 'Generating...' : 'Generate AI Review'}
              </button>
            </div>

            {/* AI Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* AI Review */}
              {aiReview && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <h3 className="text-[var(--color-text-primary)] font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    AI Review
                  </h3>
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-purple-400">{aiReview.overallScore}/10</span>
                    <span className="text-[var(--color-text-tertiary)] ml-2">Overall Score</span>
                  </div>
                  <div className="space-y-2">
                    {aiReview.insights.map((insight, index) => (
                      <p key={index} className="text-sm text-[var(--color-text-secondary)]">• {insight}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div>
                  <h3 className="text-[var(--color-text-primary)] font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Suggestions
                  </h3>
                  <div className="space-y-3">
                    {aiSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-[var(--color-text-primary)] font-medium">{suggestion.title}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            suggestion.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            suggestion.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {suggestion.priority}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-2">{suggestion.description}</p>
                        {suggestion.timestamp && (
                          <button
                            onClick={() => onSeek(suggestion.timestamp!)}
                            className="text-xs text-purple-400 hover:text-purple-300 font-mono"
                          >
                            Go to {formatTime(suggestion.timestamp)}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!aiReview && aiSuggestions.length === 0 && !aiSuggestionsLoading && !aiReviewLoading && (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-[var(--color-text-tertiary)]">No AI insights yet</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Generate suggestions or review above</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}