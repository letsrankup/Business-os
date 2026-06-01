import CompetitorForm from "@/components/CompetitorForm";

export default function CompetitorPage() {
  return (
    <main className="p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          Competitor Analysis
        </h1>

        <p className="text-gray-400 mb-6">
          Compare your website against competitors and discover opportunities.
        </p>

        <CompetitorForm />
      </div>
    </main>
  );
}
