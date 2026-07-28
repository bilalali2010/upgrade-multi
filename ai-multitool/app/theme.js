import { extendTheme } from "@chakra-ui/react";

const config = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  fonts: {
    heading: `system-ui, -apple-system, sans-serif`,
    body: `system-ui, -apple-system, sans-serif`,
  },
});

export default theme;
