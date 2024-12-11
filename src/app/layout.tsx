import './globals.css';
import { Providers } from './providers';

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="text-forground bg-gray-800 min-h-full">
        <Providers>
          <main className="flex justify-center items-center h-full">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
