"use client";
import { useState } from "react";

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  status: "paid" | "unpaid" | "pending";
  date: string;
  dueDate: string;
}

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: "INV-001",
      clientName: "Ahmed Ali",
      clientEmail: "ahmed@example.com",
      items: [{ id: 1, description: "SEO Services", quantity: 1, price: 500 }],
      status: "paid",
      date: "2026-05-01",
      dueDate: "2026-05-15",
    },
    {
      id: "INV-002",
      clientName: "Sara Khan",
      clientEmail: "sara@example.com",
      items: [{ id: 1, description: "Content Writing", quantity: 3, price: 150 }],
      status: "unpaid",
      date: "2026-05-20",
      dueDate: "2026-06-05",
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, description: "", quantity: 1, price: 0 },
  ]);

  const addItem = () => {
    setItems([...items, { id: items.length + 1, description: "", quantity: 1, price: 0 }]);
  };

  const updateItem = (id: number, field: string, value: string | number) => {
    setItems(items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const getTotal = (invoiceItems: InvoiceItem[]) => {
    return invoiceItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const createInvoice = () => {
    if (!clientName || !dueDate) return;
    const newInvoice: Invoice = {
      id: `INV-00${invoices.length + 1}`,
      clientName,
      clientEmail,
      items,
      status: "pending",
      date: new Date().toISOString().split("T")[0],
      dueDate,
    };
    setInvoices([newInvoice, ...invoices]);
    setShowForm(false);
    setClientName("");
    setClientEmail("");
    setDueDate("");
    setItems([{ id: 1, description: "", quantity: 1, price: 0 }]);
  };

  const updateStatus = (id: string, status: "paid" | "unpaid" | "pending") => {
    setInvoices(invoices.map((inv) => inv.id === id ? { ...inv, status } : inv));
  };

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + getTotal(i.items), 0);
  const totalPending = invoices.filter(i => i.status !== "paid").reduce((sum, i) => sum + getTotal(i.items), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 font-mono">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">💰 Invoice & Billing</h1>
            <p className="text-gray-400 text-sm mt-1">Clients ko invoice bhejo aur payments track karo</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-xl bg-[#00f5a0] text-black font-bold text-sm hover:bg-[#00f5a0]/80 transition-all"
          >
            + New Invoice
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4">
            <p className="text-gray-400 text-xs mb-1">Total Received</p>
            <p className="text-2xl font-black text-[#00f5a0]">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4">
            <p className="text-gray-400 text-xs mb-1">Pending Amount</p>
            <p className="text-2xl font-black text-yellow-400">${totalPending.toLocaleString()}</p>
          </div>
        </div>

        {/* New Invoice Form */}
        {showForm && (
          <div className="bg-[#12121a] border border-[#00f5a0]/30 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">New Invoice Banao</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Client Name</label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ahmed Ali"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00f5a0]/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Client Email</label>
                <input
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="ahmed@email.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00f5a0]/50"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00f5a0]/50"
              />
            </div>

            {/* Items */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-2 block">Services / Items</label>
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-3 gap-2 mb-2">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    placeholder="Service description"
                    className="col-span-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                    placeholder="Qty"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                  />
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, "price", Number(e.target.value))}
                    placeholder="Price $"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                  />
                </div>
              ))}
              <button onClick={addItem} className="text-[#00f5a0] text-xs mt-1 hover:underline">
                + Add Item
              </button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-white font-bold">Total: ${getTotal(items).toLocaleString()}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 text-sm">
                  Cancel
                </button>
                <button onClick={createInvoice} className="px-4 py-2 rounded-xl bg-[#00f5a0] text-black font-bold text-sm">
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice List */}
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-[#12121a] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-white">{invoice.clientName}</p>
                  <p className="text-gray-400 text-xs">{invoice.id} • Due: {invoice.dueDate}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-[#00f5a0] font-bold">${getTotal(invoice.items).toLocaleString()}</p>
                  <select
                    value={invoice.status}
                    onChange={(e) => updateStatus(invoice.id, e.target.value as any)}
                    className={`text-xs px-3 py-1 rounded-lg border font-bold bg-transparent cursor-pointer ${
                      invoice.status === "paid" ? "border-green-500/50 text-green-400" :
                      invoice.status === "pending" ? "border-yellow-500/50 text-yellow-400" :
                      "border-red-500/50 text-red-400"
                    }`}
                  >
                    <option value="paid" className="bg-[#12121a]">Paid</option>
                    <option value="pending" className="bg-[#12121a]">Pending</option>
                    <option value="unpaid" className="bg-[#12121a]">Unpaid</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-white/5 pt-3">
                {invoice.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-gray-400">
                    <span>{item.description}</span>
                    <span>{item.quantity} x ${item.price} = ${item.quantity * item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
               }
