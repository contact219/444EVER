import "./globals.css";

export const metadata = {
  title: "444EVER",
  description: "444 EVER Candle Company"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900">{children}</body>
    </html>
  );
}
