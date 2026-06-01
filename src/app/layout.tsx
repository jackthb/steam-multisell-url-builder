import "./globals.css";

export const metadata = {
  title: "Steam Multi-Sell Builder",
  description: "Build Steam Market multi-sell URLs to sell multiple CS2 cases at once",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
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
