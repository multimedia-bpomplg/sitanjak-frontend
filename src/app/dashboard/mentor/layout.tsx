"use client";

import React from "react";
import DashboardLayoutWrapper from "@/components/dashboard/DashboardLayoutWrapper";
import MentorGuard from "@/components/guards/MentorGuard";

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayoutWrapper role="mentor" Guard={MentorGuard}>
      {children}
    </DashboardLayoutWrapper>
  );
}
