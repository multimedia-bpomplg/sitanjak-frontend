"use client";

import React from "react";
import DashboardLayoutWrapper from "@/components/dashboard/DashboardLayoutWrapper";

export default function PesertaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayoutWrapper role="peserta">
      {children}
    </DashboardLayoutWrapper>
  );
}
