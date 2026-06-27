"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import ChatWidget from "./ChatWidget";
import ToastListener from "./ToastListener";
import SalesCartDrawer from "./SalesCartDrawer";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <>
        <main className="admin-shell">{children}</main>
        <ToastListener />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="public-shell">{children}</main>
      <Footer />
      <SalesCartDrawer />
      <ChatWidget />
      <ToastListener />
    </>
  );
}