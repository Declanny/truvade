import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { MobileBottomNav } from "@/components/layout";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pb-16 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
