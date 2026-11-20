import SafetyStatus from "@/components/dashboard/SafetyStatus";
import QuickActions from "@/components/dashboard/QuickActions";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <header>
          <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
            SAFENET
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Safety Dashboard
          </h1>
        </header>

        <div className="mt-8">
          <SafetyStatus status="safe" />
        </div>

        <div className="mt-6">
          <QuickActions />
        </div>
      </div>
    </main>
  );
}