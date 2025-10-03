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
          <div className="flex min-h-screen min-w-5xl flex-col bg-gray-300 dark:bg-slate-800">
            <Header />
            <div className="container mx-auto">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
