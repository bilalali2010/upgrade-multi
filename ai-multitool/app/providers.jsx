"use client";

import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import theme from "./theme";

// Chakra UI's App Router integration needs its own emotion cache provider
// (CacheProvider) so styles are inserted in the correct order during server
// rendering. Wiring ChakraProvider straight into layout.jsx without this can
// break static generation of Next's auto-generated routes (e.g. /_not-found)
// with an opaque "is not a function" error at build time.
export default function Providers({ children }) {
  return (
    <CacheProvider>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>{children}</ChakraProvider>
    </CacheProvider>
  );
}
