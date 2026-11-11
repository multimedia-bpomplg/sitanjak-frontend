"use client";

import React from "react";
import DashboardLayoutWrapper from "@/components/dashboard/DashboardLayoutWrapper";
import AdminSuperadminGuard from "@/components/guards/AdminSuperadminGuard";

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayoutWrapper role="superadmin" Guard={AdminSuperadminGuard}>
      {children}
    </DashboardLayoutWrapper>
  );
}
