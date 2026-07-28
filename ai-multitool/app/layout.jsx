import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import theme from "./theme";

export const metadata = {
  title: "AI Multi Tool Suite",
  description: "16 AI-powered content generation tools in one app.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <ChakraProvider theme={theme}>{children}</ChakraProvider>
      </body>
    </html>
  );
}
