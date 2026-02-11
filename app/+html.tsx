import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover, user-scalable=no"
        />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Apni Dukan" />
        <meta name="theme-color" content="#FF8F00" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Apni Dukan" />
        <meta name="msapplication-TileColor" content="#FF8F00" />
        <meta name="description" content="Apni Dukan - Mobile grocery shop management app for daily price lists, bills, UPI payments" />

        <link rel="apple-touch-icon" href="/ApniDukan/pwa-icon-192.png" />
        <link rel="manifest" href="/ApniDukan/manifest.json" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root { height: 100%; }
          body { overflow: hidden; overscroll-behavior: none; -webkit-user-select: none; user-select: none; }
          #root { display: flex; }
          @media (display-mode: standalone) {
            body { -webkit-tap-highlight-color: transparent; }
          }
        ` }} />

        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/ApniDukan/sw.js').catch(function() {});
            });
          }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
