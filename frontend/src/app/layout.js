
import "./globals.css";
import { BaseUrlProvider } from "./BASEURLContext";




export const metadata = {
  title: "Exam Page",
  description: "From Academic Vitality",
};

export default async function RootLayout({ children }) {

  return (
    <html lang="en">
      <body>
        <BaseUrlProvider>
          {children}
        </BaseUrlProvider>
      </body>
    </html>
  );
}



