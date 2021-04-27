import Head from 'next/head'
import { Header, Segment, Container } from 'semantic-ui-react'

export default function Home() {
  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container>
        <Segment style={{ maxWidth: '800px', margin: 'auto' }}>
          <Header>Hello World</Header>
        </Segment>
      </Container>
    </div>
  )
}
