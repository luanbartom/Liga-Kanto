import "@/styles/globals.css";
import Head from "next/head";
import FloatingLinks from "@/components/FloatingLinks";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // se a rota atual começar com /battle, não renderiza o botão
  const hideFloatingButton = router.pathname.startsWith("/battle");

  return (
    <>
      <Head>
        <title>Liga Kanto - Batalhas Pokémon</title>
        <meta
          name="description"
          content="Sistema de batalhas Pokémon estilo Kanto, feito por Luan e Ivan."
        />
      </Head>

      <Component {...pageProps} />

      {!hideFloatingButton && <FloatingLinks />}
    </>
  );
}
