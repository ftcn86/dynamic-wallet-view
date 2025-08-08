
"use client";

/**
 * @fileOverview A centralized service for handling user feedback submissions.
 */

/**
 * Simulates submitting user feedback to a backend service.
 * In a real app, this would send an email or save to a database.
 */
export async function submitFeedback(feedbackData: { type: string; message: string; pagePath?: string }): Promise<{ success: boolean }> {
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(feedbackData)
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
  return res.json();
}
