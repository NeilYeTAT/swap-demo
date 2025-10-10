import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/styles/index.css';
import { appName } from '@/configs/app';
import { fontsClassName } from '@/lib/utils/fonts';
import { Header } from '@/ui/app/header';
import { Providers } from '@/ui/components/providers';

export const metadata: Metadata = {
  title: appName,
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fontsClassName}>
        <Providers>
          <div className="flex min-h-screen max-w-screen flex-col overflow-x-hidden">
            <Header />
            <div className="container mx-auto flex flex-1">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
