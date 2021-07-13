import axios from 'axios';
import Error from 'next/error';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Button, Divider, Menu, Icon, Segment } from "semantic-ui-react";
import css from '../../styles/admin/index.module.css';

export default function Reported() {
    const { data, error } = useQuery('/api/admin/posts/reported', () =>
        axios.get('/api/admin/posts/reported').then(res => res.data)
    );
    const queryClient = useQueryClient();
    if (error) {
        return <Error
            statusCode={error.response?.status}
            title={error.response?.data.message || error.message}
        />
    }
    const onDelete = postId => {
        if (confirm('Are you sure you want to delete this post?')) {
            axios.post(`/api/admin/posts/reported/delete/${postId}`)
                .then(() => {
                    queryClient.invalidateQueries();
                });
        }
    }
    return <div className={css.page}>
        <Head>
            <title>Reported</title>
        </Head>
        <PageMenu />
        <div className={css.content}>
            <Menu secondary>
                <Menu.Item header>Reported</Menu.Item>
            </Menu>
            <Segment>
                {data?.map(({ _id, user, post, reason, createdAt }) =>
                    <React.Fragment key={_id}>
                        <div style={{ display: 'flex' }}>
                            <img src={user.avatar || '/default-avatar.svg'} style={{ width: '2em', height: '2em', borderRadius: '50%', objectFit: 'cover' }} />
                            <div style={{ width: 0, flexGrow: 1, marginLeft: '0.5em' }}>
                                <div>
                                    <a style={{ fontWeight: 'bold' }}>{`${user.firstName} ${user.lastName}`}</a>
                                    <span style={{ color: 'lightgrey', float: 'right' }}>
                                        {new Date(createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <div>{reason}</div>
                                <div style={{ border: '1px solid lightgrey', padding: '0.5em' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <img src={post.user.avatar || '/default-avatar.svg'} style={{ width: '2em', height: '2em', borderRadius: '50%', objectFit: 'cover' }} />
                                        <a style={{ fontWeight: 'bold' }}>{`${post.user.firstName} ${post.user.lastName}`}</a>
                                    </div>
                                    <div>
                                        {post.text}
                                    </div>
                                    <div style={{ display: 'flex', overflow: 'auto' }}>
                                        {post.files.map(f =>
                                            f.resourceType === 'image'
                                                ? <img src={f.url} key={f.url} style={{ width: '150px', height: '150px', objectFit: 'contain', background: 'lightgrey', margin: '0.25em' }} />
                                                : <video src={f.url} controls key={f.url} style={{ width: '150px', height: '150px', objectFit: 'contain', background: 'lightgrey', margin: '0.25em' }} />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <Link href={`/posts/details/${post._id}`}>
                                        <Button as='a' content='View post' />
                                    </Link>
                                    <Button onClick={() => onDelete(post._id)}>Delete</Button>
                                </div>
                            </div>
                        </div>
                        <Divider />
                    </React.Fragment>
                )}
            </Segment>
        </div>
    </div>
}

function PageMenu() {
    return <Menu vertical icon='labeled' style={{ minWidth: '200px' }}>
        <Link href='/admin'>
            <Menu.Item as='a'>
                <Icon name='chart bar' />
                Dashboard
            </Menu.Item>
        </Link>
        <Link href='/admin/users'>
            <Menu.Item as='a'>
                <Icon name='group' />
                Users
            </Menu.Item>
        </Link>
        <Link href='/admin/reported'>
            <Menu.Item as='a' active>
                <Icon name='flag' />
                Reported Posts
            </Menu.Item>
        </Link>
    </Menu>
}