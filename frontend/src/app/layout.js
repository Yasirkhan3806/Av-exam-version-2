import "./globals.css";
import { BaseUrlProvider } from "../context/BASEURLContext";
import ErrorBoundary from "../components/ErrorBoundary";
import GlobalErrorListener from "../components/GlobalErrorListener";

export const metadata = {
  title: "Exam Page",
  description: "From Academic Vitality",
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <GlobalErrorListener />
        <ErrorBoundary>
          <BaseUrlProvider>{children}</BaseUrlProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
