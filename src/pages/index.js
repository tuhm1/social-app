import axios from 'axios';
import Link from 'next/link';
import React from 'react';
import { useInfiniteQuery } from 'react-query';
import { Loader, Menu } from 'semantic-ui-react';
import PostCard from '../components/posts/PostCard';
import ScrollDetector from '../components/ScrollDectector';

export default function Home() {
  const { data, fetchNextPage, isFetching, hasNextPage } = useInfiniteQuery('/api/posts/home',
    async ({ pageParam }) =>
      axios.get('/api/posts/home', { params: { cursor: pageParam } })
        .then(res => res.data),
    { getNextPageParam: last => last[last.length - 1]?._id }
  );
  return <div style={{ maxWidth: '700px', margin: 'auto', padding: '1em', background: 'white', minHeight: '100%' }}>
    <PageMenu />
    {data && data.pages
      .reduce((posts, page) => [...posts, ...page], [])
      .map(p => <PostCard key={p._id} {...p} />)
    }
    {!isFetching && hasNextPage && <ScrollDetector onScroll={() => fetchNextPage()} />}
    {isFetching && <Loader inline='centered' active />}
  </div>
}

function PageMenu() {
  return <Menu secondary pointing>
    <Link href='/'>
      <Menu.Item active>Explore</Menu.Item>
    </Link>
    <Link href='/posts/following'>
      <Menu.Item as='a'>Following</Menu.Item>
    </Link>
    <Menu.Menu position='right'>
      <Link href='/search'>
        <Menu.Item as='a' icon='search' />
      </Link>
      <Link href='/posts/create'>
        <Menu.Item as='a' icon='edit' />
      </Link>
    </Menu.Menu>
  </Menu>
}