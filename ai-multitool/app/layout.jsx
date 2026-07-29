import Providers from "./providers";

export const metadata = {
  title: "AI Multi Tool Suite",
  description: "16 AI-powered content generation tools in one app.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
