import OfferingsTable from "@/components/offerings/OfferingsTable";
import OfferingsAnalytics from "@/components/offerings/OfferingsAnalytics";
import LinkButton from "@/components/ui/LinkButton";
import PageHeader from "@/components/ui/PageHeader";

export default function OfferingsPage() {
  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Offerings"
        actions={<LinkButton href="/dashboard/offerings/create">Record Offering</LinkButton>}
      />
      <OfferingsAnalytics />
      <hr className="my-8 border-neutral-200" />
      <OfferingsTable />
    </div>
  );
}
