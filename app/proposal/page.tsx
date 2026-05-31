"use client";
import AppLayout from "@/components/AppLayout";
import ProposalForm from "@/components/ProposalForm";

export default function ProposalPage() {
  return (
    <AppLayout title="Proposals">
      <div>
        <h1 className="text-2xl font-black">Proposal <span className="text-[#f5a000]">Generator</span></h1>
        <p className="text-gray-400 text-xs mt-1">Professional client proposals in seconds</p>
      </div>
      <ProposalForm />
    </AppLayout>
  );
}
