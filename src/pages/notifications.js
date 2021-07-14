import axios from 'axios';
import Error from 'next/error';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import { useQuery, useQueryClient } from "react-query";
import { Image, List, Menu } from 'semantic-ui-react';
import css from '../styles/Notifications.module.css';

export default function Notifications() {
    const { data, error, isLoading } = useQuery('/api/notifications/general', () =>
        axios.get('/api/notifications/general')
            .then(res => res.data)
    );
    const queryClient = useQueryClient();
    if (isLoading) return null;
    if (error) {
        return <Error
            statusCode={error.response.status}
            title={error.response.data}
        />
    }
    const clearAll = () => {
        const notSeen = data.filter(n => !n.seen).map(n => n._id);
        if (notSeen.length > 0) {
            axios.put('/api/notifications/general', notSeen)
                .then(() => queryClient.invalidateQueries());
        }
    }
    const clear = _id => {
        axios.put('/api/notifications/general', [_id])
            .then(() => queryClient.invalidateQueries());
    }
    return <div style={{ maxWidth: '700px', margin: 'auto', padding: '1em', minHeight: '100%', background: 'white' }}>
        <Head>
            <title>Notifications</title>
        </Head>
        <Menu secondary pointing>
            <Menu.Item header>Notifications</Menu.Item>
            <Menu.Item position='right' onClick={clearAll} icon='check' />
        </Menu>
        <List selection>
            {data.map(n =>
                n.type === 'like'
                    ? <LikeNotification {...n} key={n._id} onClick={() => clear(n._id)} />
                    : n.type === 'comment'
                        ? <CommentNotification {...n} key={n._id} onClick={() => clear(n._id)} />
                        : n.type === 'reply'
                            ? <ReplyNotification {...n} key={n._id} onClick={() => clear(n._id)} />
                            : <FollowNotification {...n} key={n._id} onClick={() => clear(n._id)} />
            )}
        </List>
    </div>
}

function LikeNotification({ like: { post, user, createdAt }, seen, onClick }) {
    return <Link href={`/posts/details/${post._id}`}>
        <List.Item onClick={onClick} style={{ display: 'flex', background: !seen && 'rgba(0, 0, 0, 0.03)' }}>
            <Image src={user.avatar || '/default-avatar.svg'} avatar />
            <List.Content style={{ flexGrow: 1, width: 0 }}>
                <List.Header style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Link href={`/users/${user._id}`}>
                        <a>{`${user.firstName} ${user.lastName}`}</a>
                    </Link> liked your post: "{post.text}"
                </List.Header>
                <List.Description>
                    <span className={css.time}>
                        {new Date(createdAt).toLocaleString()}
                    </span>
                </List.Description>
            </List.Content>
        </List.Item>
    </Link>
}

function CommentNotification({ comment: { postId, text, post, user, createdAt }, seen, onClick }) {
    return <Link href={`/posts/details/${postId}`}>
        <List.Item onClick={onClick} style={{ display: 'flex', background: !seen && 'rgba(0, 0, 0, 0.03)' }}>
            <Image src={user.avatar || '/default-avatar.svg'} avatar />
            <List.Content style={{ flexGrow: 1, width: 0 }}>
                <List.Header style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Link href={`/users/${user._id}`}>
                        <a>{`${user.firstName} ${user.lastName}`}</a>
                    </Link> commented on your post: "{post.text}"
                </List.Header>
                <List.Description>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {text}
                    </div>
                    <span className={css.time}>
                        {new Date(createdAt).toLocaleString()}
                    </span>
                </List.Description>
            </List.Content>
        </List.Item>
    </Link>
}

function ReplyNotification({ reply: { postId, text, comment, user, createdAt }, seen, onClick }) {
    return <Link href={`/posts/details/${postId}`}>
        <List.Item onClick={onClick} style={{ display: 'flex', background: !seen && 'rgba(0, 0, 0, 0.03)' }}>
            <Image src={user.avatar || '/default-avatar.svg'} avatar />
            <List.Content style={{ flexGrow: 1, width: 0 }}>
                <List.Header style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Link href={`/users/${user._id}`}>
                        <a>{`${user.firstName} ${user.lastName}`}</a>
                    </Link> replied to your comment: "{comment.text}"
                </List.Header>
                <List.Description>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {text}
                    </div>
                    <span className={css.time}>
                        {new Date(createdAt).toLocaleString()}
                    </span>
                </List.Description>
            </List.Content>
        </List.Item>
    </Link>
}

function FollowNotification({ follow: { follower: { _id, firstName, lastName, avatar }, createdAt }, seen, onClick }) {
    return <Link href={`/users/${_id}`}>
        <List.Item onClick={onClick} style={{ display: 'flex', background: !seen && 'rgba(0, 0, 0, 0.03)' }}>
            <Image src={avatar || '/default-avatar.svg'} avatar />
            <List.Content style={{ flexGrow: 1, width: 0 }}>
                <List.Header>
                    <Link href={`/users/${_id}`}>
                        <a className={css.username}>{`${firstName} ${lastName}`}</a>
                    </Link> is following you.
                </List.Header>
                <List.Description>
                    <span className={css.time}>
                        {new Date(createdAt).toLocaleString()}
                    </span>
                </List.Description>
            </List.Content>
        </List.Item>
    </Link>
}