// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Fênix Skins",
  description: "Marketplace P2P brasileiro",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
