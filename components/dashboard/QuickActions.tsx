const actions = [
  {
    title: "Start Journey",
    description: "Let SAFENET watch over your trip.",
    href: "/journeys",
  },
  {
    title: "Report Incident",
    description: "Report something happening around you.",
    href: "/incidents",
  },
  {
    title: "SOS",
    description: "Request immediate assistance.",
    href: "/sos",
  },
  {
    title: "Safety Map",
    description: "View safety information around you.",
    href: "/map",
  },
];

export default function QuickActions() {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">
        Quick actions
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {actions.map((action) => (
          <a
            key={action.href}
            href={action.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
          >
            <h3 className="font-semibold text-slate-900">
              {action.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {action.description}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}