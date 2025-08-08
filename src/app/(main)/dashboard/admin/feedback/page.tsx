"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function AdminFeedbackPage() {
  const router = useRouter();
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Admin • Feedback</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>This section will show all feedback and allow replies. For now, use the main Admin page.</p>
          <Button variant="outline" onClick={() => router.push('/dashboard/admin')}>Go to Admin</Button>
        </CardContent>
      </Card>
    </div>
  );
}


