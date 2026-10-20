import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meta Leads Dashboard",
  description: "Meta Ads leads, spend and campaign performance dashboard",
};

const themeScript = `try{var t=localStorage.getItem("theme");var q=new URLSearchParams(location.search).get("theme");var dark=q?q!=="light":(t?t==="dark":true);document.documentElement.classList.toggle("dark",dark);}catch(e){document.documentElement.classList.add("dark")}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
