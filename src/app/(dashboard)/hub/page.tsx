"use client";

import Link from "next/link";
import { CreditCard, Calendar, Image, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const platforms = [
  {
    name: "Hugo",
    description: "Track your subscriptions and insurance policies",
    icon: CreditCard,
    href: process.env.NEXT_PUBLIC_HUGO_URL || "http://localhost:3001",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    name: "Plans",
    description: "Create events and plan with friends",
    icon: Calendar,
    href: process.env.NEXT_PUBLIC_PLANS_URL || "http://localhost:3002",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  {
    name: "Photo",
    description: "Share and organize photos with family",
    icon: Image,
    href: process.env.NEXT_PUBLIC_PHOTO_URL || "http://localhost:3003",
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
];

export default function HubPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to hifamily</h1>
        <p className="text-muted-foreground">Access all your family and friends platforms in one place</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <a
              key={platform.name}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Card className="hover:border-primary/40 transition-colors cursor-pointer group h-full">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className={`h-12 w-12 rounded-lg ${platform.bgColor} ${platform.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{platform.name}</h3>
                    <p className="text-sm text-muted-foreground">{platform.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-primary text-sm font-medium mt-auto">
                    Open <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}
