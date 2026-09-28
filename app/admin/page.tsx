import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-bg border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-text-primary">NSES Admin</span>
          <span className="text-xs bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded-full">
            Admin Panel
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-text-secondary">{session.user?.name || "Admin"}</span>
          <Link
            href="/api/auth/signout"
            className="text-text-secondary hover:text-error transition-colors"
          >
            Sign Out
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/import"
            className="p-5 bg-bg border border-border rounded-md shadow-card hover:border-accent transition-colors group"
          >
            <h2 className="font-semibold text-text-primary group-hover:text-accent">
              Excel Import →
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Upload semester spreadsheet and preview records.
            </p>
          </Link>
          <Link
            href="/admin/photos"
            className="p-5 bg-bg border border-border rounded-md shadow-card hover:border-accent transition-colors group"
          >
            <h2 className="font-semibold text-text-primary group-hover:text-accent">
              Bulk Photos →
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Upload member photos matched by Student ID.
            </p>
          </Link>
          <Link
            href="/admin/people"
            className="p-5 bg-bg border border-border rounded-md shadow-card hover:border-accent transition-colors group"
          >
            <h2 className="font-semibold text-text-primary group-hover:text-accent">
              People Directory →
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              View, edit, and toggle active/former status.
            </p>
          </Link>
          <Link
            href="/admin/qr"
            className="p-5 bg-bg border border-border rounded-md shadow-card hover:border-accent transition-colors group"
          >
            <h2 className="font-semibold text-text-primary group-hover:text-accent">
              QR Generation →
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Preview single QR codes and export all as ZIP.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
