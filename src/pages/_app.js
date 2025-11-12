import "@/styles/globals.css";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Liga Kanto - Batalhas Pokémon</title>
        <meta name="description" content="Sistema de batalhas Pokémon estilo Kanto, feito por Luan e Ivan." />
      </Head>

      <Component {...pageProps} />
    </>
  );
}
