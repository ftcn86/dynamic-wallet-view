
"use client";

import LegalPageLayout from '@/components/layout/LegalPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';
import { MessageSquareIcon, SendIcon } from '@/components/shared/icons';
import { submitFeedback } from '@/services/feedbackService';
import { useAuth } from '@/contexts/AuthContext';

function FeedbackCard() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user } = useAuth();
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedback.trim()) {
            toast({
                title: "Feedback is empty",
                description: "Please write some feedback before submitting.",
                variant: "destructive"
            });
            return;
        }
        setIsSubmitting(true);
        try {
            await submitFeedback({
                type: 'general_help',
                message: feedback,
                userId: user?.id,
            });
            toast({
                title: "Feedback Submitted",
                description: "Thank you! We appreciate you helping us improve."
            });
            setFeedback("");
        } catch (error) {
            toast({
                title: "Submission Failed",
                description: "Could not submit your feedback. Please try again later.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl shadow-xl mt-6">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <MessageSquareIcon className="mr-2 h-6 w-6" />
                    Submit Feedback
                </CardTitle>
                <CardDescription>
                    Have a suggestion or found a bug? Let us know!
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                        placeholder="Type your feedback here..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={5}
                        disabled={isSubmitting}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting || !feedback.trim()}>
                        {isSubmitting ? (
                            <LoadingSpinner className="mr-2" />
                        ) : (
                            <SendIcon className="mr-2 h-4 w-4" />
                        )}
                        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export default function HelpPage() {
  const { t, getLegalSections } = useTranslation();
  const helpSections = getLegalSections('legal.helpSections');

  return (
    <div className="flex min-h-screen flex-col items-center bg-background p-4 py-8">
        <div className="w-full max-w-2xl">
            <LegalPageLayout
              pageTitle={t('legal.helpTitle')}
              sections={helpSections}
              displayMode="accordion"
            />
            <FeedbackCard />
        </div>
    </div>
  );
}
