import { useEffect, useState } from 'react';
import {
    Container, Image, Button, Segment, Header, Icon,
    Form, Message, Comment, Divider, Placeholder
} from "semantic-ui-react";
import Link from 'next/link';
import { useRouter } from 'next/router';
import mongoose from "mongoose";
import Carousel from '../../components/Carousel';
import axios from 'axios';
import io from 'socket.io-client';

export async function getServerSideProps({ req, params: { _id } }) {
    const { Post } = req.app.get('dbContext');
    const result = await Post.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(_id) } },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'users' } },
        { $lookup: { from: 'likes', localField: '_id', foreignField: 'postId', as: 'likes' } },
        { $lookup: { from: 'comments', localField: '_id', foreignField: 'postId', as: 'comments' } },
        { $set: { user: { $arrayElemAt: ['$users', 0] } } },
        {
            $project: {
                _id: 1, text: 1, files: 1, 'user._id': 1, 'user.avatar': 1,
                'user.firstName': 1, 'user.lastName': 1, 'likes.userId': 1,
                'commentsCount': { $size: '$comments' }
            }
        }
    ]);
    const post = result.length > 0 ? result[0] : null;
    return {
        props: {
            currentUserId: req.user ?? null,
            post: JSON.parse(JSON.stringify(post))
        }
    };
}

export default function Post({ post, currentUserId }) {
    const router = useRouter();
    useEffect(() => {
        const socket = io();
        socket.onAny(() => {
            router.replace(router.asPath, undefined, { scroll: false });
        });
        return () => socket.close();
    }, []);
    
    if (!post) {
        return <PostNotFound />
    }
    const { _id, text, files, user, likes, commentsCount } = post;
    return <div style={{ maxWidth: '700px', margin: 'auto' }}>
        <div>
            <Image src={user.avatar || '/default-avatar.svg'} avatar style={{ height: '3em', width: '3em' }} />
            <Link href={`/users/${user._id}`}>
                <a style={{ fontSize: 'large' }}>
                    {`${user.firstName} ${user.lastName}`}
                </a>
            </Link>
        </div>
        <p style={{ fontSize: 'large' }}>
            {text}
        </p>
        {files?.length > 0 && <Carousel files={files} />}
        <div>
            <LikeButton postId={_id} likes={likes} currentUserId={currentUserId} />
            <Button basic icon='comment' content={commentsCount} />
        </div>
        <CommentSection postId={_id} />
    </div>
}

function LikeButton({ postId, likes, currentUserId }) {
    const [response, setResponse] = useState({ status: 'idle' });
    const liked = likes.some(l => l.userId === currentUserId);
    if (liked) {
        const onClick = () => {
            setResponse({ status: 'loading' });
            axios.delete(`/api/likes/${postId}`)
                .then(() => {
                    setResponse({ status: 'success' });
                }).catch(error => {
                    setResponse({ status: 'error', error });
                });
        };
        return <Button
            onClick={onClick}
            content={likes.length}
            primary
            icon='like'
        />
    }
    const onClick = () => {
        setResponse({ status: 'loading' });
        axios.post(`/api/likes/${postId}`)
            .then(() => {
                setResponse({ status: 'success' });
            }).catch(error => {
                setResponse({ status: 'error', error });
            });
    };
    return <Button
        onClick={onClick}
        content={likes.length}
        basic
        icon='like'
        loading={response.status === 'loading'}
    />
}

function CommentSection({ postId }) {
    const [root, setRoot] = useState({ postId });
    useEffect(() => setRoot({ postId }), [postId]);
    return <Comment.Group size='large' id='comments'>
        <Header dividing>Comments</Header>
        {root.postId
            ? <RootComments postId={postId} onReply={_id => setRoot({ replyTo: _id })} />
            : <Replies
                postId={postId}
                replyTo={root.replyTo}
                onBack={replyTo => setRoot(replyTo ? { replyTo } : { postId })}
                onReply={_id => setRoot({ replyTo: _id })}
            />
        }
    </Comment.Group>
}

function RootComments({ postId, onReply }) {
    const [data, setData] = useState();
    useEffect(() => {
        const fetchComments = async () => {
            const { data } = await axios.get(`/api/comments`, { params: { postId } })
            setData(data);
        }
        fetchComments();
        const socket = io();
        socket.onAny(() => fetchComments());
        return () => socket.close();
    }, [postId]);

    if (!data) return <CommentsPlaceHolder />;
    return <>
        <CommentForm postId={postId} />
        {data.map(({ _id, text, user: { firstName, lastName, avatar }, repliesCount }) =>
            <Comment key={_id}>
                <Comment.Avatar src={avatar || '/default-avatar.svg'} />
                <Comment.Content>
                    <Comment.Author>{`${firstName} ${lastName}`}</Comment.Author>
                    <Comment.Text>{text}</Comment.Text>
                    <Comment.Actions>
                        <Comment.Action onClick={() => onReply(_id)}>
                            {`Reply ${repliesCount > 0 ? ` (${repliesCount})` : ''}`}
                        </Comment.Action>
                    </Comment.Actions>
                </Comment.Content>
            </Comment>
        )}
    </>
}

function Replies({ postId, replyTo, onBack, onReply }) {
    const [data, setData] = useState();
    useEffect(() => {
        const fetchComments = async () => {
            const { data } = await axios.get(`/api/comments`, { params: { replyTo } })
            setData(data);
        }
        fetchComments();
        const socket = io();
        socket.onAny(() => fetchComments());
        return () => socket.close();
    }, [replyTo]);
    if (!data) return <CommentsPlaceHolder />;
    const { text, replyTo: parent, user: { firstName, lastName, avatar }, replies } = data[0];
    return <Comment>
        <Header>
            <Button icon='angle left' onClick={() => onBack(parent)} />
                Replies
            </Header>
        <Comment.Avatar src={avatar || '/default-avatar.svg'} />
        <Comment.Content>
            <Comment.Author>{`${firstName} ${lastName}`}</Comment.Author>
            <Comment.Text>{text}</Comment.Text>
            <Divider />
            <CommentForm postId={postId} replyTo={replyTo} />
            <Comment.Group>
                {replies.map(({ _id, text, user: { firstName, lastName, avatar }, repliesCount }) =>
                    <Comment key={_id}>
                        <Comment.Avatar src={avatar || '/default-avatar.svg'} />
                        <Comment.Content>
                            <Comment.Author>{`${firstName} ${lastName}`}</Comment.Author>
                            <Comment.Text>{text}</Comment.Text>
                            <Comment.Actions>
                                <Comment.Action onClick={() => onReply(_id)}>
                                    {`Reply${repliesCount > 0 ? ` (${repliesCount})` : ''}`}
                                </Comment.Action>
                            </Comment.Actions>
                        </Comment.Content>
                    </Comment>
                )}
            </Comment.Group>
        </Comment.Content>
    </Comment>
}

function CommentsPlaceHolder() {
    return <Placeholder>
        {[...Array(5)].map((_, i) =>
            <Placeholder.Header image key={i}>
                <Placeholder.Line />
                <Placeholder.Line />
            </Placeholder.Header>
        )}
    </Placeholder>;
}

function CommentForm({ postId, replyTo }) {
    const [response, setResponse] = useState({ status: 'idle' });
    const onSubmit = e => {
        e.preventDefault();
        setResponse({ status: 'loading' });
        axios.post(`/api/comments`, { text: e.target.text.value, postId, replyTo })
            .then(() => {
                setResponse({ status: 'success' });
                e.target.reset();
            }).catch(error => {
                setResponse({ status: 'error', error });
            });
    }
    return <Form
        onSubmit={onSubmit}
        loading={response.status === 'loading'}
        error={response.status === 'error'}
    >
        <Form.TextArea name='text' placeholder='Add a comment...' required />
        {response.status === 'error'
            && <Message error>
                <Message.Header>Error</Message.Header>
                <Message.Content>
                    {response.error.response?.data.message || response.error.message}
                </Message.Content>
            </Message>
        }
        <Button type='submit' icon='edit' content='Add Comment' primary />
    </Form>
}

function PostNotFound() {
    const router = useRouter();
    return <Container>
        <Segment placeholder>
            <Header icon>
                <Icon name='search' />
            Post not found
        </Header>
            <Segment.Inline>
                <Button primary onClick={() => router.back()}>
                    Go back
            </Button>
            </Segment.Inline>
        </Segment>
    </Container>
}