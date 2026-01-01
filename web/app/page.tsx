import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
              DAI
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-900">Diamond Auction Intelligence</div>
              <div className="text-xs text-gray-500">Forecasts, optimization, explainability</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="btn-secondary">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
            Predict Diamond Auction Outcomes with AI
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Machine learning platform for predicting final prices, sale probabilities, and optimal reserve prices
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/auth" className="btn-primary px-6 py-3 text-base">
              Get started
            </Link>
            <Link href="/dashboard" className="btn-secondary px-6 py-3 text-base">
              View dashboard
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900">Dataset management</h3>
            <p className="mt-2 text-sm text-gray-600">
              Work with built-in synthetic data or connect your own datasets (when enabled).
            </p>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900">Predictions & optimization</h3>
            <p className="mt-2 text-sm text-gray-600">
              Run forecasts, get reserve recommendations, and explore tradeoffs with solution surfaces.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900">Analytics & history</h3>
            <p className="mt-2 text-sm text-gray-600">
              Review runs over time and inspect explainability outputs to build trust in results.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}












