// Componente raiz do Next.js: aplica estilos globais e injeta páginas
import '@/styles/globals.css';

export default function App({ Component, pageProps }) {
  // Renderiza a página atual com suas props
  return <Component {...pageProps} />;
}
