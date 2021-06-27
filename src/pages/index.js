import axios from 'axios';
import React from 'react';
import { Menu } from 'semantic-ui-react';
import PostCard from '../components/posts/PostCard';
import Link from 'next/link';
import { useQuery } from 'react-query';
import PostCreateModal from './posts/create';

export default function Home() {
  const { data: posts } = useQuery('/api/posts/home', () =>
    axios.get('/api/posts/home').then(res => res.data)
  );
  return <div style={{ maxWidth: '700px', margin: 'auto', padding: '1em' }}>
    <PageMenu />
    {posts?.map(p => <PostCard key={p._id} {...p} />)}
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
      <PostCreateModal trigger={<Menu.Item as='a' icon='edit' />} />
    </Menu.Menu>
  </Menu>
}