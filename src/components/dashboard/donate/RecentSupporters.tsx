
"use client"

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

// Represents a single donation event as it would come from the server
type DonationEvent = {
    name: string;
    amount: number;
};

interface RecentSupportersProps {
    supporters: DonationEvent[];
}

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" fill="#fde047" />
      <path d="M20 3L18.5 6L16 7.5l2.5 1.5L20 11l1.5-2.5L24 7.5l-2.5-1.5L20 3z" fill="#fde047"/>
      <path d="M5 3L3.5 6L1 7.5l2.5 1.5L5 11l1.5-2.5L9 7.5l-2.5-1.5L5 3z" fill="#fde047"/>
    </svg>
);
  

export function RecentSupporters({ supporters }: RecentSupportersProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!supporters || supporters.length === 0) return;

        // Cycle through the available donations every 3 seconds
        const cycleInterval = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % supporters.length);
        }, 3000);

        return () => clearInterval(cycleInterval);
    }, [supporters]);

    if (!supporters || !supporters.length) {
        return <Skeleton className="h-14 w-full" />;
    }
    
    const currentDonation = supporters[currentIndex];

    return (
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 h-14 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
            <motion.div
                key={currentDonation.name + currentIndex} // Key change triggers animation
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center text-sm"
            >
                <SparklesIcon className="h-5 w-5 mr-3" />
                <p className="font-semibold text-primary">{currentDonation.name}</p>
                <p className="text-muted-foreground ml-1.5"> just supported with {currentDonation.amount}π!</p>
            </motion.div>
        </AnimatePresence>
      </div>
    );
}
