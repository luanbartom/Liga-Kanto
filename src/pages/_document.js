// Documento HTML customizado do Next.js: permite meta tags globais e body classes
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon padrão */}
        <link rel="icon" href="/favicon.png" />

        {/* Se quiser PNG ao invés de ICO */}
        {/* <link rel="icon" type="image/png" href="/favicon.png" /> */}
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}