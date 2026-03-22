import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-68px)] flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <p className="text-7xl font-bold text-[#0B3D2C]">404</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Page not found</h1>
          <p className="text-gray-500 mt-2">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved or no longer exists.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link href="/">
              <Button variant="primary" size="lg">Go home</Button>
            </Link>
            <Link href="/shortlets">
              <Button variant="outline" size="lg">Browse shortlets</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
