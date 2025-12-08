import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="mr-72 min-h-screen p-8 pb-20">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="mr-72 py-4 text-center border-t border-white/10 bg-background/50 backdrop-blur-sm">
        <p className="text-sm text-muted-foreground">
          طراح سایت: پارسا عیدی‌دهنه
        </p>
      </footer>
    </div>
  );
};
