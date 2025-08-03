import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ML Experiment Dashboard - Next App",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-LN+7fdVzj6u52u30Kp6M/trliBMCMKTyK833zpbD+pXdCLuTusPj697FH4R/5mcr" crossOrigin="anonymous"></link>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
