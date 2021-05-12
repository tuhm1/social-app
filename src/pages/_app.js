import 'semantic-ui-css/semantic.min.css';
import AppShell from '../components/AppShell';
import io from 'socket.io-client';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  useEffect(() => {
    const socket = io();
    socket.onAny(() => {
      router.replace(router.asPath, undefined, { scroll: false });
    });
    return () => socket.close();
  }, []);
  return <AppShell currentUserId={pageProps.currentUserId}>
    <Component {...pageProps} />
  </AppShell>
}

export default MyApp
