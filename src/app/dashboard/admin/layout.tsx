"use client";

import React from "react";
import DashboardLayoutWrapper from "@/components/dashboard/DashboardLayoutWrapper";
import AdminSuperadminGuard from "@/components/guards/AdminSuperadminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayoutWrapper role="admin" Guard={AdminSuperadminGuard}>
      {children}
    </DashboardLayoutWrapper>
  );
}
