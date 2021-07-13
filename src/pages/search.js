import axios from "axios";
import Head from 'next/head';
import Link from 'next/link';
import { useState } from "react";
import { Button, Form, Header, Icon, Image, Input, List, Menu, Segment } from "semantic-ui-react";
import PostCard from '../components/posts/PostCard';

export default function Search() {
    const [type, setType] = useState('user');
    const [text, setText] = useState('');
    const [result, setResult] = useState(null);
    const onSubmit = e => {
        e.preventDefault();
        axios.get(`/api/search/${type}`, { params: { text: text } })
            .then(res => {
                setResult(res.data);
            });
    }
    return <div style={{ maxWidth: '700px', margin: 'auto', padding: '1em', minHeight: '100%', background: 'white' }}>
        <Head>
            <title>Search</title>
        </Head>
        <Menu secondary pointing>
            <Menu.Item header>Search</Menu.Item>
        </Menu>
        <Form onSubmit={onSubmit}>
            <div style={{ display: 'flex' }}>
                <Input
                    type='search'
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={type === 'user'
                        ? 'Search user by name, username, email'
                        : 'Search post by text'
                    }
                    required
                    style={{ flexGrow: 1 }}
                />
                <Button type='submit' icon='search' primary />
            </div>
            <Form.Select
                style={{ width: 'auto' }}
                label='Type'
                options={[
                    { key: 'user', text: 'User', value: 'user' },
                    { key: 'post', text: 'Post', value: 'post' }
                ]}
                value={type}
                onChange={(e, { value }) => {
                    setType(value);
                    setText('');
                    setResult(null);
                }}
            />
        </Form>
        {result
            && <div style={{ marginTop: '1em' }}>
                <Menu secondary pointing>
                    <Menu.Item header>Results</Menu.Item>
                </Menu>
                <div>
                    {(type === 'post'
                        ? <PostResults posts={result} />
                        : <UserResults users={result} />
                    )}
                </div>
            </div>
        }
    </div>
}

function UserResults({ users }) {
    if (users.length === 0) {
        return <Segment placeholder>
            <Header icon>
                <Icon name='search' />
                No results found.
            </Header>
        </Segment>
    }
    return <List selection>
        {users.map(u =>
            <Link href={`/users/${u._id}`} key={u._id} >
                <List.Item>
                    <Image avatar src={u.avatar || '/default-avatar.svg'} />
                    <List.Content>
                        <List.Header as='a'>{`${u.firstName} ${u.lastName}`}</List.Header>
                        <List.Description>
                            {u.username && <div>{`@${u.username}`}</div>}
                            {u.email && <div>{u.email}</div>}
                            <div>
                                <Icon name='group' /> {u.followersCount} followers
                            </div>
                        </List.Description>
                    </List.Content>
                </List.Item>
            </Link>
        )}
    </List>
}

function PostResults({ posts }) {
    if (posts.length === 0) {
        return <Segment placeholder>
            <Header icon>
                <Icon name='search' />
                No results found.
            </Header>
        </Segment>
    }
    return posts.map(p => <PostCard {...p} key={p._id} />)
}