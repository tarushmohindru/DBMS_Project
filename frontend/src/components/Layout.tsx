import React from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import { useAuth } from '@/context/AuthContext';

interface LayoutProps {
  children:    React.ReactNode;
  title?:      string;
  description?: string;
}

export default function Layout({ children, title = 'Carbon Credit Marketplace' }: LayoutProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <>
        <Head><title>{title}</title></Head>
        {children}
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{title} — Carbon Credit Marketplace</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="ml-60 min-h-screen">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
