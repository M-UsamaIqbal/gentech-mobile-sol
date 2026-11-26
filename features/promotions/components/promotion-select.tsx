"use client";

import * as React from "react";
import { Zap, Star, TrendingUp, Award, Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface PromotionPlan {
  id: string;
  name: string;
  placement: string;
  price: number;
  duration: number;
  description: string;
}

interface Props {
  plans: PromotionPlan[];
  selectedPlanId?: string;
  onSelect: (plan: PromotionPlan) => void;
  onPurchase?: (plan: PromotionPlan) => void;
}

const PLACEMENT_ICONS: Record<string, React.ReactNode> = {
  FEATURED: <Star className="size-4" />,
  BOOSTED: <TrendingUp className="size-4" />,
  TOP_SEARCH: <Zap className="size-4" />,
  CATEGORY_FEATURED: <Award className="size-4" />,
  HOMEPAGE_FEATURED: <Crown className="size-4" />,
};

const PLACEMENT_LABELS: Record<string, string> = {
  FEATURED: "Featured",
  BOOSTED: "Boosted",
  TOP_SEARCH: "Top Search",
  CATEGORY_FEATURED: "Category Featured",
  HOMEPAGE_FEATURED: "Homepage Featured",
};

export function PromotionSelect({ plans, selectedPlanId, onSelect, onPurchase }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => {
        const isSelected = selectedPlanId === plan.id;
        const Icon = PLACEMENT_ICONS[plan.placement];
        const placementLabel = PLACEMENT_LABELS[plan.placement] || plan.placement;

        return (
          <Card
            key={plan.id}
            className={`cursor-pointer transition-all ${
              isSelected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
            }`}
            onClick={() => onSelect(plan)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {Icon}
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                {isSelected && <Badge variant="default">Selected</Badge>}
              </div>
              <CardDescription>{placementLabel}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-primary text-2xl font-bold">
                  Rs. {plan.price.toLocaleString()}
                </p>
                <p className="text-muted-foreground text-sm">{plan.duration} days</p>
              </div>
              <p className="text-muted-foreground text-sm">{plan.description}</p>
              {onPurchase && (
                <Button
                  className="w-full"
                  variant={isSelected ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPurchase(plan);
                  }}
                >
                  {isSelected ? "Purchase Selected" : "Select & Purchase"}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
