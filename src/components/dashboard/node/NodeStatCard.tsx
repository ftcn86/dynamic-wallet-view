
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface NodeStatCardProps {
    title: string;
    icon: React.ReactNode;
    mainContent: React.ReactNode;
    footerText: string;
}

export function NodeStatCard({ title, icon, mainContent, footerText }: NodeStatCardProps) {
    return (
        <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {mainContent}
                </div>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">{footerText}</p>
            </CardFooter>
        </Card>
    );
}
