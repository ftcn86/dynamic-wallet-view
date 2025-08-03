
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ReactMarkdown from 'react-markdown';
import type { LegalSection } from '@/data/schemas';
import { useAuth } from '@/contexts/AuthContext';

// Solid SVG Icon
const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);


interface LegalPageLayoutProps {
  pageTitle: string;
  sections?: LegalSection[]; 
  content?: string; 
  displayMode: 'accordion' | 'markdown';
}

export default function LegalPageLayout({ pageTitle, sections, content, displayMode }: LegalPageLayoutProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleReturn = () => {
    // All users now have terms accepted, just go back
    router.back();
  };

  return (
    <div className="flex w-full items-center justify-center">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-xl sm:text-2xl font-headline">{pageTitle}</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[60vh] overflow-y-auto">
          {displayMode === 'accordion' && sections && sections.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {sections.map((section, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>{section.title}</AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert max-w-none px-1 pb-3 sm:pb-4">
                    <ReactMarkdown>{section.content}</ReactMarkdown>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : displayMode === 'markdown' && content ? (
            <div className="prose dark:prose-invert max-w-none px-1 pb-3 sm:pb-4">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <p>Content is not available.</p> 
          )}
        </CardContent>
        <CardFooter className="pt-3 sm:pt-4">
          <Button variant="outline" onClick={handleReturn}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Return to App
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
