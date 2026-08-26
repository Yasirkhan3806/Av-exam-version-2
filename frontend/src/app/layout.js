import "./globals.css";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

import { BaseUrlProvider } from "../context/BASEURLContext";
import ErrorBoundary from "../components/ErrorBoundary";
import GlobalErrorListener from "../components/GlobalErrorListener";

export const metadata = {
  title: "Exam Page",
  description: "From Academic Vitality",
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable}`}>
      <body suppressHydrationWarning>
        <GlobalErrorListener />
        <ErrorBoundary>
          <BaseUrlProvider>{children}</BaseUrlProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
