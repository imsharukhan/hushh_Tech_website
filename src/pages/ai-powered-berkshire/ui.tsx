import React from 'react';
import { Box } from "@chakra-ui/react";
import { Helmet } from "react-helmet";
import { useAIPoweredBerkshireLogic } from "./logic";

const AIPoweredBerkshirePage = () => {
  const { pageTitle, pageDescription, iframeSrc, iframeTitle } = useAIPoweredBerkshireLogic();

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      <Box 
        position="fixed"
        top="64px"
        left="0"
        right="0"
        bottom="0"
        height="calc(100vh - 64px)"
        overflow="hidden"
        margin="0"
        padding="0"
        zIndex="999"
        bg="white"
      >
        <Box
          as="iframe"
          src={iframeSrc}
          title={iframeTitle}
          allowFullScreen
          width="100%"
          height="100%"
          border="0"
          display="block"
        />
      </Box>
    </>
  );
};

export default AIPoweredBerkshirePage;
