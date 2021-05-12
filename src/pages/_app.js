import 'semantic-ui-css/semantic.min.css';
import AppShell from '../components/AppShell'
function MyApp({ Component, pageProps }) {
  return <AppShell currentUserId={pageProps.currentUserId}>
    <Component {...pageProps} />
  </AppShell>
}

export default MyApp
