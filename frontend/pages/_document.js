import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <meta charSet="utf-8" />
        <link
          rel="stylesheet"
          href="https://statics.goorm.io/gds/foundation/v0.19.0/vapor-foundation.dark.min.css"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}