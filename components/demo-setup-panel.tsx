export function DemoSetupPanel() {
  return (
    <section className="panel px-7 py-6 sm:px-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
            Supabase Setup
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Connect real auth and data in a few minutes
          </h2>
          <p className="text-sm leading-6 text-slate-500">
            SpendMapr is running in demo mode because Supabase keys are not configured yet.
            Add your project keys to <span className="font-medium text-slate-700">`.env.local`</span>,
            run the schema SQL, then refresh the app.
          </p>
        </div>

        <div className="surface-muted min-w-[280px] px-5 py-4">
          <p className="text-sm font-medium text-slate-900">What to add</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            `NEXT_PUBLIC_APP_URL`
          </p>
          <p className="text-sm leading-6 text-slate-500">`NEXT_PUBLIC_SUPABASE_URL`</p>
          <p className="text-sm leading-6 text-slate-500">`NEXT_PUBLIC_SUPABASE_ANON_KEY`</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="surface-muted interactive-card px-5 py-4">
          <p className="text-sm font-medium text-slate-900">1. Create the project</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            In Supabase, create a new project and enable Email auth.
          </p>
        </div>
        <div className="surface-muted interactive-card px-5 py-4">
          <p className="text-sm font-medium text-slate-900">2. Add local env values</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Copy the project URL and anon key into `.env.local`.
          </p>
        </div>
        <div className="surface-muted interactive-card px-5 py-4">
          <p className="text-sm font-medium text-slate-900">3. Run the schema</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Paste `supabase/schema.sql` into the SQL editor, then refresh.
          </p>
        </div>
      </div>
    </section>
  );
}
