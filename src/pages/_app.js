import 'semantic-ui-css/semantic.min.css';
import TopNav from '../components/TopMenu';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
});

function MyApp({ Component, pageProps }) {
  return <QueryClientProvider client={queryClient} >
    <TopNav>
      <Component {...pageProps} />
    </TopNav>
  </QueryClientProvider>
}

export default MyApp
