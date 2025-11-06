import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: "noindex, nofollow",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-stone-950 via-stone-950 to-stone-900">
      <div className="text-center px-6 py-12 md:px-8 md:py-16 max-w-2xl mx-auto">
        <div className="mb-8 md:mb-12">
          <div className="text-7xl md:text-9xl mb-4 md:mb-6 animate-bounce">😅</div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight">
            Whoops! Page Not Found
          </h1>
        </div>
        <p className="text-gray-300 mb-8 md:mb-12 text-lg md:text-xl leading-relaxed max-w-lg mx-auto">
          Looks like this page took a salary cut and disappeared. But don&apos;t worry, your wage
          data is safe with us!
        </p>
        <div className="space-y-4">
          <Link
            href="/en"
            className="inline-flex items-center px-6 py-2 md:px-8 md:py-3 border border-transparent text-lg md:text-xl font-semibold rounded-md text-white bg-stone-600 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Go back home
          </Link>
          <div className="pt-6 md:pt-8">
            <p className="text-gray-400 text-sm md:text-base">
              💡 Tip: Try checking the URL or go back to explore salary data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
