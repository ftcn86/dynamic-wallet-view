
"use client"

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { submitFeedback } from '@/services/feedbackService';
import { SendIcon } from '@/components/shared/icons';

const LightbulbIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15.09 16.09a7 7 0 0 1-5.59-8.59l.39-2.02.39-2.02A1 1 0 0 1 11 2h2a1 1 0 0 1 .9.56l.39 2.02.39 2.02a7 7 0 0 1-5.59 8.59Z" fill="hsl(var(--primary))"/>
    <path d="M18.81 19.92a4 4 0 0 1-5.66 5.66" />
    <path d="M12 22v-2" />
  </svg>
);


export function AIFeatureFeedbackCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast({
        title: "Please enter your feedback",
        description: "Your thoughts are valuable to us!",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
        await submitFeedback({
            type: 'ai_feature',
            message: feedback,
            userId: user?.id
        });
        toast({
            title: "Thank You!",
            description: "Your feedback has been submitted. We appreciate you helping shape the future of this app.",
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
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <LightbulbIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                Future AI Tool: Mining Rate Forecaster
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
                We're developing an AI tool to help forecast your potential mining rate based on different lockup scenarios. Is this a feature you would use?
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            <form onSubmit={handleSubmit} className="space-y-4 h-full flex flex-col">
                <div className="flex-grow">
                    <Textarea
                        id="feedback-textarea"
                        placeholder="e.g., 'Yes, that would help me decide on a lockup strategy.' or 'No, the current calculator is enough for me.'"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={5}
                        disabled={isSubmitting}
                        className="h-full text-xs sm:text-sm"
                    />
                </div>
            </form>
        </CardContent>
         <CardFooter>
            <Button onClick={handleSubmit} className="w-full text-xs sm:text-sm" disabled={isSubmitting || !feedback.trim()}>
                {isSubmitting ? <LoadingSpinner className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> : <SendIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />}
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
        </CardFooter>
    </Card>
  );
}
