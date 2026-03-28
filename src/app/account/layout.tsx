import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { MobileBottomNav } from "@/components/layout";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pb-16 md:pb-0">
        <div className="max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-10 pt-1 md:pt-2 pb-12">
          {children}
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
