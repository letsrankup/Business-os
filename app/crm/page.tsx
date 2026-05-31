"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";

const clients = [
  { id:1, name:"TechCorp Inc.",    email:"hello@techcorp.com",   status:"Active",   stage:"Onboarded",   value:"$2,400", av:"T" },
  { id:2, name:"Startup XYZ",      email:"ceo@startupxyz.io",    status:"Proposal", stage:"Negotiation", value:"$800",   av:"S" },
  { id:3, name:"Acme Solutions",   email:"info@acme.com",         status:"Active",   stage:"Retainer",    value:"$5,200", av:"A" },
  { id:4, name:"BlueWave Media",   email:"contact@bluewave.co",  status:"Lead",     stage:"Discovery",   value:"$1,200", av:"B" },
  { id:5, name:"NovaTech LLC",     email:"team@novatech.com",    status:"Inactive", stage:"Closed",      value:"$600",   av:"N" },
];

const stageColor: Record<string,string> = { Onboarded:"#00f5a0", Negotiation:"#f5a000", Retainer:"#00d9f5", Discovery:"#f500f5", Closed:"#555" };
const statusColor: Record<string,string> = { Active:"#00f5a0", Proposal:"#f5a000", Lead:"#00d9f5", Inactive:"#555" };

export default function CRMPage() {
  const [search, setSearch] = useState("");
  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout title="CRM">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Client <span className="text-[#f500f5]">CRM</span></h1>
          <p className="text-gray-400 text-xs mt-1">Manage all clients in one place</p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-[#f500f5]/20 border border-[#f500f5]/30 text-[#f500f5] text-sm font-bold hover:bg-[#f500f5]/30 transition-all">+ Add Client</button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
        className="w-full bg-[#12121a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#f500f5]/40 transition-all" />

      <div className="bg-[#12121a] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-500 uppercase">
              {["Client","Status","Stage","Value","Actions"].map(h => (
                <th key={h} className="text-left p-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f500f5]/20 to-[#00f5a0]/20 flex items-center justify-center font-bold text-sm">{c.av}</div>
                    <div>
                      <p className="text-sm font-bold text-white">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-xs px-2 py-1 rounded-full border"
                    style={{ color:statusColor[c.status]||"#aaa", borderColor:(statusColor[c.status]||"#aaa")+"44", background:(statusColor[c.status]||"#aaa")+"11" }}>
                    {c.status}
                  </span>
                </td>
                <td className="p-4"><span className="text-sm" style={{ color:stageColor[c.stage]||"#aaa" }}>{c.stage}</span></td>
                <td className="p-4"><span className="text-sm font-bold text-[#00f5a0]">{c.value}</span></td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button className="text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all">View</button>
                    <button className="text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
