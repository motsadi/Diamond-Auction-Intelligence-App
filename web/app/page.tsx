import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">Diamond Auction Intelligence</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth" className="text-gray-700 hover:text-indigo-600">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Predict Diamond Auction Outcomes with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Machine learning platform for predicting final prices, sale probabilities, and optimal reserve prices
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/auth"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700"
            >
              Get Started
            </Link>
            <Link
              href="/dashboard"
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">📊 Dataset Management</h3>
            <p className="text-gray-600">
              Upload and manage your auction datasets securely in Google Cloud Storage
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">🤖 ML Predictions</h3>
            <p className="text-gray-600">
              Train models and generate predictions for price and sale probability
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">📈 Analytics</h3>
            <p className="text-gray-600">
              Explore data, view correlations, and analyze prediction history
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}












