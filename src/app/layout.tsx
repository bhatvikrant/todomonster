import "~/styles/globals.css";

import { Inter as FontSans } from "next/font/google";
import { ReplicacheContextProvider } from "~/lib/create-replicache-context";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Todomonster | Your todo list for the day",
  description: "Start your day with a todo list",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
      //  className={cn(
      //   "min-h-screen bg-background font-sans antialiased",
      //   fontSans.variable,
      // )}
      >
        <ReplicacheContextProvider>{children}</ReplicacheContextProvider>
      </body>
    </html>
  );
}
