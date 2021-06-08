import 'semantic-ui-css/semantic.min.css';
import AppShell from '../components/AppShell';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  return <QueryClientProvider client={queryClient}>
    <AppShell currentUserId={pageProps.currentUserId}>
      <Component {...pageProps} />
    </AppShell>
  </QueryClientProvider>
}

export default MyApp
