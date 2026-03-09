import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HeartbeatProvider } from "@/components/providers/heartbeat-provider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <HeartbeatProvider>
        <main>{children}</main>
      </HeartbeatProvider>
      <Footer />
    </>
  );
}
