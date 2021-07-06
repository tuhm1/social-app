import axios from 'axios';
import Error from 'next/error';
import Link from 'next/link';
import React from 'react';
import { useQuery } from "react-query";
import { Divider, Header, Menu, List, Image } from 'semantic-ui-react';
import css from '../styles/Notifications.module.css';
import Head from 'next/head';

export default function Notifications() {
    const { data, error, isLoading } = useQuery('/api/notifications/general', () =>
        axios.get('/api/notifications/general')
            .then(res => res.data)
    );
    if (isLoading) return null;
    if (error) {
        return <Error
            statusCode={error.response.status}
            title={error.response.data}
        />
    }
    return <div style={{ maxWidth: '700px', margin: 'auto', padding: '1em' }}>
        <Head>
            <title>Notifications</title>
        </Head>
        <Menu secondary pointing>
            <Menu.Item header>Notifications</Menu.Item>
        </Menu>
        <List selection>
            {data.map(n =>
                n.type === 'like'
                    ? <LikeNotification {...n.like} key={n._id} />
                    : n.type === 'comment'
                        ? <CommentNotification {...n.comment} key={n._id} />
                        : <ReplyNotification {...n.reply} key={n._id} />
            )}
        </List>
    </div>
}

function LikeNotification({ postId, user: { _id, firstName, lastName, avatar }, createdAt }) {
    return <Link href={`/posts/details/${postId}`}>
        <List.Item style={{ display: 'flex' }}>
            <Image src={avatar || '/default-avatar.svg'} avatar />
            <List.Content style={{ flexGrow: 1, display: 'flex' }}>
                <div className={css.summary}>
                    <Link href={`/users/${_id}`}>
                        <a className={css.username}>{`${firstName} ${lastName}`}</a>
                    </Link> liked your post.
                </div>
                <span className={css.time}>
                    {new Date(createdAt).toLocaleString()}
                </span>
            </List.Content>
        </List.Item>
    </Link>
}

function CommentNotification({ postId, user: { _id, firstName, lastName, avatar }, createdAt }) {
    return <Link href={`/posts/details/${postId}`}>
        <List.Item style={{ display: 'flex' }}>
            <Image src={avatar || '/default-avatar.svg'} avatar />
            <List.Content style={{ flexGrow: 1, display: 'flex' }}>
                <div className={css.summary}>
                    <Link href={`/users/${_id}`}>
                        <a className={css.username}>{`${firstName} ${lastName}`}</a>
                    </Link> commented on your post.
                </div>
                <span className={css.time}>
                    {new Date(createdAt).toLocaleString()}
                </span>
            </List.Content>
        </List.Item>
    </Link>
}


function ReplyNotification({ postId, user: { _id, firstName, lastName, avatar }, createdAt }) {
    return <Link href={`/posts/details/${postId}`}>
        <List.Item style={{ display: 'flex' }}>
            <Image src={avatar || '/default-avatar.svg'} avatar />
            <List.Content style={{ flexGrow: 1, display: 'flex' }}>
                <div className={css.summary}>
                    <Link href={`/users/${_id}`}>
                        <a className={css.username}>{`${firstName} ${lastName}`}</a>
                    </Link> replied to your comment.
                </div>
                <span className={css.time}>
                    {new Date(createdAt).toLocaleString()}
                </span>
            </List.Content>
        </List.Item>
    </Link>
}