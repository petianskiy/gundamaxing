"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Background image */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
        />
        <div className="fixed inset-0 bg-black/65" />

        {/* Content */}
        <div className="w-full max-w-lg relative z-10">{children}</div>
      </main>
      <Footer />
    </>
  );
}
