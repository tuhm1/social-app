import axios from 'axios';
import Error from 'next/error';
import Link from 'next/link';
import React from 'react';
import { useQuery } from "react-query";
import { Divider, Header } from 'semantic-ui-react';
import css from '../styles/Notifications.module.css';

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
        <Header as='h2' dividing>Notifications</Header>
        <div>
            {data.map(n =>
                <React.Fragment key={n._id}>
                    {n.type === 'follow'
                        ? <FollowNotification {...n} />
                        : n.type === 'like'
                            ? <LikeNotification {...n} />
                            : n.type === 'comment'
                                ? <CommentNotification {...n} />
                                : <ReplyNotification {...n} />
                    }
                    <Divider />
                </React.Fragment>)}
        </div>
    </div>
}

function FollowNotification({ createdAt, follower: { _id, firstName, lastName, avatar } }) {
    return <Link href={`/users/${_id}`}>
        <a className={css.item}>
            <img src={avatar || '/default-avatar.svg'} className={css.avatar} />
            <div className={css.content}>
                <div className={css.summary}>
                    <Link href={`/users/${_id}`}>
                        <a className={css.username}>{`${firstName} ${lastName}`}</a>
                    </Link> followed you.
                </div>
                <span className={css.time}>
                    {new Date(createdAt).toLocaleString()}
                </span>
            </div>
        </a>
    </Link>
}

function LikeNotification({ postId, likeUser: { _id, firstName, lastName, avatar }, createdAt }) {
    return <Link href={`/posts/${postId}`}>
        <a className={css.item}>
            <img src={avatar || '/default-avatar.svg'} className={css.avatar} />
            <div className={css.content}>
                <div className={css.summary}>
                    <Link href={`/users/${_id}`}>
                        <a className={css.username}>{`${firstName} ${lastName}`}</a>
                    </Link> liked your post.
                </div>
                <span className={css.time}>
                    {new Date(createdAt).toLocaleString()}
                </span>
            </div>
        </a>
    </Link>
}

function CommentNotification({ postId, commentUser: { _id, firstName, lastName, avatar }, createdAt }) {
    return <Link href={`/posts/${postId}`}>
        <a className={css.item}>
            <img src={avatar || '/default-avatar.svg'} className={css.avatar} />
            <div className={css.content}>
                <div className={css.summary}>
                    <Link href={`/users/${_id}`}>
                        <a className={css.username}>{`${firstName} ${lastName}`}</a>
                    </Link> commented on your post.
                </div>
                <span className={css.time}>
                    {new Date(createdAt).toLocaleString()}
                </span>
            </div>
        </a>
    </Link>
}


function ReplyNotification({ postId, replyUser: { _id, firstName, lastName, avatar }, createdAt }) {
    return <Link href={`/posts/${postId}`}>
        <a className={css.item}>
            <img src={avatar || '/default-avatar.svg'} className={css.avatar} />
            <div className={css.content}>
                <div className={css.summary}>
                    <Link href={`/users/${_id}`}>
                        <a className={css.username}>{`${firstName} ${lastName}`}</a>
                    </Link> replied to your comment.
                </div>
                <span className={css.time}>
                    {new Date(createdAt).toLocaleString()}
                </span>
            </div>
        </a>
    </Link>
}