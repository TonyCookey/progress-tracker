import OfferingsTable from "@/components/offerings/OfferingsTable";
import OfferingsAnalytics from "@/components/offerings/OfferingsAnalytics";
import LinkButton from "@/components/ui/LinkButton";
import PageHeader from "@/components/ui/PageHeader";

export default function OfferingsPage() {
  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Offerings"
        description="Giving trends and every offering recorded in the app."
        actions={<LinkButton href="/dashboard/offerings/create">Record Offering</LinkButton>}
      />
      <OfferingsAnalytics />
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Recorded offerings</h2>
        <OfferingsTable />
      </section>
    </div>
  );
}
