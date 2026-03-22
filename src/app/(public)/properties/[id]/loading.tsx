import { PropertyDetailSkeleton } from "@/components/ui";
import { Container } from "@/components/layout";

export default function PropertyDetailLoading() {
  return (
    <Container size="lg">
      <div className="py-4 md:py-8">
        <PropertyDetailSkeleton />
      </div>
    </Container>
  );
}
