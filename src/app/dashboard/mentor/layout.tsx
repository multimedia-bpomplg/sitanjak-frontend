"use client";

import React from "react";
import DashboardLayoutWrapper from "@/components/dashboard/DashboardLayoutWrapper";

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayoutWrapper role="mentor">
      {children}
    </DashboardLayoutWrapper>
  );
}
