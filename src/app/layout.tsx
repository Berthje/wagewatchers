import type { Metadata } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import { OpenPanelComponent } from "@openpanel/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "WageWatchers - European Salary Transparency Platform",
    template: "%s | WageWatchers",
  },
  description:
    "Community-driven salary transparency across European markets. Compare salaries, benefits, and work conditions with data from anonymous salary discussions.",
  keywords: [
    "salary",
    "transparency",
    "compensation",
    "Europe",
    "Belgium",
    "Netherlands",
    "jobs",
    "career",
    "wage",
    "pay",
    "salary comparison",
  ],
  authors: [{ name: "Layton Berth (Berthje)" }],
  creator: "Layton Berth (Berthje)",
  publisher: "WageWatchers",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://wagewatchers.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://wagewatchers.com",
    title: "WageWatchers - European Salary Transparency Platform",
    description:
      "Community-driven salary transparency across European markets. Compare salaries, benefits, and work conditions with data from anonymous salary discussions.",
    siteName: "WageWatchers",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WageWatchers - European Salary Transparency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WageWatchers - European Salary Transparency Platform",
    description:
      "Community-driven salary transparency across European markets. Compare salaries, benefits, and work conditions with data from anonymous salary discussions.",
    images: ["/og-image.png"],
    creator: "@wagewatchers",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-site-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "WageWatchers",
    description:
      "Community-driven salary transparency across European markets. Compare salaries, benefits, and work conditions with data from anonymous salary discussions.",
    url: "https://wagewatchers.com",
    author: {
      "@type": "Person",
      name: "Layton Berth (Berthje)",
    },
    publisher: {
      "@type": "Organization",
      name: "WageWatchers",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://wagewatchers.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} antialiased`}
      >
        <OpenPanelComponent
          apiUrl="/api/op"
          cdnUrl="/op1.js"
          clientId={process.env.OPENPANEL_CLIENT_ID!}
          trackScreenViews={true}
          trackOutgoingLinks={true}
          trackAttributes={true}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
