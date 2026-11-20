export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-slate-400">
          SAFENET
        </p>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Stay aware. Stay connected. Stay safe.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          A safety intelligence and emergency coordination platform designed
          to help people monitor journeys, report incidents, and call for help.
        </p>

        <div className="mt-10 flex gap-4">
          <button className="rounded-lg bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200">
            Get Started
          </button>

          <button className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-900">
            Learn More
          </button>
        </div>
      </section>
    </main>
  );
}