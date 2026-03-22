import "./styles/globals.css";
import { ReactNode } from "react";
import SessionProviderWrapper from "./SessionProviderWrapper";

export const metadata = {
  title: "AlgoForge Lite",
  description: "Resource-efficient hierarchical executor",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>
          <header className="global-header">
            <h2>AlgoForge</h2>
            <nav style={{ display: 'flex', gap: '24px', flex: 1, marginLeft: '32px' }}>
              <a href="/">Task Executor</a>
              <a href="/marketplace">Provider Marketplace</a>
            </nav>
            <div>
              <a href="/api/auth/signin" style={{ fontSize: '0.9rem', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px' }}>
                GitHub Login
              </a>
            </div>
          </header>
          <main>{children}</main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
