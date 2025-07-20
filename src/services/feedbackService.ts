
"use client";

import { mockApiCall } from '@/lib/api';

/**
 * @fileOverview A centralized service for handling user feedback submissions.
 */

/**
 * Simulates submitting user feedback to a backend service.
 * In a real app, this would send an email or save to a database.
 */
export async function submitFeedback(feedbackData: {
  type: 'ai_feature' | 'general_help';
  message: string;
  userId?: string;
}): Promise<{ success: boolean }> {
  console.log("Submitting feedback via centralized service:", feedbackData);
  // This is where you would add logic to send an email or post to your backend API.
  return mockApiCall({ data: { success: true } });
}
