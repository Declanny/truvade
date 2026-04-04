import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { MobileBottomNav } from "@/components/layout";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
