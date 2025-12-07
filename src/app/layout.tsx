import "./globals.css";

export const metadata = {
  title: "Steam Multi-Sell Builder",
  description: "Build Steam Market multi-sell URLs to sell multiple CS2 cases at once",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
