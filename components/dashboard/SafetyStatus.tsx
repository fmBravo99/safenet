type SafetyStatusProps = {
  status: "safe" | "concern" | "emergency";
};

const statusConfig = {
  safe: {
    label: "You're safe",
    description: "No active emergency has been reported.",
    indicator: "🟢",
  },
  concern: {
    label: "Safety concern",
    description: "Something requires your attention.",
    indicator: "🟠",
  },
  emergency: {
    label: "Emergency active",
    description: "Your emergency response is active.",
    indicator: "🔴",
  },
};

export default function SafetyStatus({ status }: SafetyStatusProps) {
  const currentStatus = statusConfig[status];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        Your safety status
      </p>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-2xl">{currentStatus.indicator}</span>

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {currentStatus.label}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {currentStatus.description}
          </p>
        </div>
      </div>
    </section>
  );
}