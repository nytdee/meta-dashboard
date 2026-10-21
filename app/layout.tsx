import type { Metadata } from "next";
import type { ReactNode } from "react";
import TopNav from "@/components/top-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meta Ads Intelligence",
  description:
    "Meta Ads intelligence: performance overview, creative analysis and campaign diagnostics",
};

const themeScript = `try{var t=localStorage.getItem("theme");var q=new URLSearchParams(location.search).get("theme");var d=q?q!=="light":(t?t==="dark":true);document.documentElement.classList.toggle("dark",d);}catch(e){document.documentElement.classList.add("dark")}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
