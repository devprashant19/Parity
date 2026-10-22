import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-[#0F172A] dark:text-[#F1F5F9] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-mono-val font-bold text-slate-500 mb-4 border border-slate-200 dark:border-slate-700">
        404
      </div>
      <h1 className="font-serif-heading text-2xl font-bold tracking-tight mb-2">
        Page Not Found
      </h1>
      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mb-6">
        The document or route you requested does not exist in this verification workspace.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5"
      >
        Return to Verification Dashboard
      </Link>
    </div>
  );
}
