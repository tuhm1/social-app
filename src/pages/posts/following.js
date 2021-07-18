import axios from 'axios';
import React from 'react';
import { Menu, Segment, Header, Icon } from 'semantic-ui-react';
import PostCard from '../../components/posts/PostCard';
import Link from 'next/link';
import { useQuery } from 'react-query';
import PostCreateModal from './create';

export default function Following() {
    const { data: posts, error } = useQuery('/api/posts/following', () =>
        axios.get('/api/posts/following').then(res => res.data)
    );
    return <div style={{ maxWidth: '700px', margin: 'auto', padding: '1em', background: 'white', minHeight: '100%' }}>
        <PageMenu />
        {error
            ? <Segment placeholder>
                <Header icon>
                    <Icon name='user' />
                    {error.response?.data || error.message}
                </Header>
            </Segment>
            : posts?.map(p => <PostCard key={p._id} {...p} />)
        }
    </div>
}

function PageMenu() {
    return <Menu secondary pointing>
        <Link href='/'>
            <Menu.Item>Explore</Menu.Item>
        </Link>
        <Link href='/posts/following'>
            <Menu.Item as='a' active>Following</Menu.Item>
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