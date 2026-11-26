import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Zap, Plus } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { getCurrentSession } from "@/lib/session";
import { getUserActivePromotions } from "@/features/promotions/services/promotion.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { 
  title: "My Promotions",
  robots: { index: false, follow: false },
};

export default async function PromotionsPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.signIn);

  const { user } = session;
  const promotions = await getUserActivePromotions(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Promotions</h1>
          <p className="text-muted-foreground text-sm">Manage your listing promotions</p>
        </div>
        <Link href={`${ROUTES.dashboard}/promotions/new`}>
          <Button>
            <Plus className="mr-2 size-4" />
            New Promotion
          </Button>
        </Link>
      </div>

      {promotions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Active Promotions</CardTitle>
            <CardDescription>
              Promote your listings to get more visibility and sell faster.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`${ROUTES.dashboard}/promotions/new`}>
              <Button variant="outline">
                <Zap className="mr-2 size-4" />
                Create Your First Promotion
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {promotions.map((promo) => (
            <Card key={promo.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{promo.listingTitle}</CardTitle>
                    <CardDescription>
                      {new Date(promo.startedAt).toLocaleDateString()} —{" "}
                      {new Date(promo.expiresAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{promo.placement}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Status</p>
                    <p className="font-medium">{promo.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-sm">Paid</p>
                    <p className="font-medium">Rs. {promo.amountPaid.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
