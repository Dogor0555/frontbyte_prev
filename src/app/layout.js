import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Byte Fusion Soluciones",
  description: "Transforme su proceso de facturación con nuestra plataforma intuitiva...",
  icons: {
    icon: "/logoo.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}



