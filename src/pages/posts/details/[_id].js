import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import {
    Button,
    Comment, Container,
    Divider, Form, Header, Icon,
    Message, Placeholder, Segment,
    Modal,
    TextArea,
    Dropdown
} from "semantic-ui-react";
import Carousel from '../../../components/Carousel';
import css from '../../../styles/PostDetails.module.css';

export default function Post() {
    const router = useRouter();
    const { _id } = router.query;
    const { data: post, isLoading } = useQuery(`/api/posts/details/${_id}`, () =>
        axios.get(`/api/posts/details/${_id}`).then(res => res.data)
    );
    const { data: currentUserId } = useQuery('/api/auth/me', () =>
        axios.get('/api/auth/me').then(res => res.data)
    );
    if (isLoading) return null;
    if (!post) return <PostNotFound />

    const { text, files, user, likes, commentsCount, createdAt } = post;
    return <div className={css.container}>
        {files?.length > 0 &&
            <div className={css.media}>
                <Carousel files={files} />
            </div>
        }
        <div className={css.text}>
            <div className={css.textHeader}>
                <img src={user.avatar || '/default-avatar.svg'} className={css.avatar} />
                <div className={css.textHeaderTitle}>
                    <Link href={`/users/${user._id}`}>
                        <a className={css.username}>
                            {`${user.firstName} ${user.lastName}`}
                        </a>
                    </Link>
                    <div className={css.time}>
                        {new Date(createdAt).toLocaleString()}
                    </div>
                </div>
                <DropdownActions _id={_id} userId={user._id} currentUserId={currentUserId} />
            </div>
            <p>
                {text}
            </p>
            <div>
                <LikeButton postId={_id} likes={likes} currentUserId={currentUserId} />
                <Button basic icon='comment' content={commentsCount} />
            </div>
            <CommentSection postId={_id} currentUserId={currentUserId} />
        </div>
    </div>
}

function LikeButton({ postId, likes, currentUserId }) {
    const [response, setResponse] = useState({ status: 'idle' });
    const queryClient = useQueryClient();
    const liked = likes.some(l => l.userId === currentUserId);
    if (liked) {
        const onClick = () => {
            setResponse({ status: 'loading' });
            axios.delete(`/api/likes/${postId}`)
                .catch(error => {
                    alert(error.response?.data.message || error.message);
                }).finally(() => {
                    setResponse({ status: 'idle' });
                    queryClient.invalidateQueries();
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
            .catch(error => {
                alert(error.response?.data.message || error.message);
            }).finally(() => {
                setResponse({ status: 'idle' });
                queryClient.invalidateQueries();
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

function CommentSection({ postId, currentUserId }) {
    const [root, setRoot] = useState({ postId });
    useEffect(() => setRoot({ postId }), [postId]);
    return <Comment.Group id='comments'>
        <Header dividing>Comments</Header>
        {root.postId
            ? <RootComments
                postId={postId}
                onReply={_id => setRoot({ replyTo: _id })}
                currentUserId={currentUserId}
            />
            : <Replies
                postId={postId}
                replyTo={root.replyTo}
                onBack={replyTo => setRoot(replyTo ? { replyTo } : { postId })}
                onReply={_id => setRoot({ replyTo: _id })}
                currentUserId={currentUserId}
            />
        }
    </Comment.Group>
}

function RootComments({ postId, onReply, currentUserId }) {
    const { data } = useQuery(`/api/comments/post/${postId}`, () =>
        axios.get(`/api/comments/post/${postId}`).then(res => res.data)
    );
    if (!data) return <CommentsPlaceHolder />;
    return <>
        <CommentForm postId={postId} />
        {data.map(({ _id, text, user, repliesCount }) =>
            <Comment key={_id}>
                <CommentAvatar src={user.avatar} />
                <Comment.Content>
                    <CommentAuthor {...user} />
                    <Comment.Text>{text}</Comment.Text>
                    <Comment.Actions>
                        <Comment.Action onClick={() => onReply(_id)}>
                            {`Reply ${repliesCount > 0 ? ` (${repliesCount})` : ''}`}
                        </Comment.Action>
                        {currentUserId === user._id
                            && <>
                                <EditComment _id={_id} />
                                <DeleteComment _id={_id} />
                            </>
                        }
                    </Comment.Actions>
                </Comment.Content>
            </Comment>
        )}
    </>
}

function Replies({ postId, replyTo, onBack, onReply, currentUserId }) {
    const { data } = useQuery(`/api/comments/comment/${replyTo}`, () =>
        axios.get(`/api/comments/comment/${replyTo}`).then(res => res.data)
    );
    if (!data) return <CommentsPlaceHolder />;
    const { text, replyTo: parent, user, replies } = data[0];
    return <Comment>
        <Header>
            <Button basic icon='angle left' onClick={() => onBack(parent)} />
            Replies
        </Header>
        <CommentAvatar src={user.avatar} />
        <Comment.Content>
            <CommentAuthor {...user} />
            <Comment.Text>{text}</Comment.Text>
            <Divider />
            <CommentForm postId={postId} replyTo={replyTo} />
            <Comment.Group>
                {replies.map(({ _id, text, user, repliesCount }) =>
                    <Comment key={_id}>
                        <CommentAvatar src={user.avatar} />
                        <Comment.Content>
                            <CommentAuthor {...user} />
                            <Comment.Text>{text}</Comment.Text>
                            <Comment.Actions>
                                <Comment.Action onClick={() => onReply(_id)}>
                                    {`Reply${repliesCount > 0 ? ` (${repliesCount})` : ''}`}
                                </Comment.Action>
                                {currentUserId === user._id
                                    && <>
                                        <EditComment _id={_id} />
                                        <DeleteComment _id={_id} />
                                    </>
                                }
                            </Comment.Actions>
                        </Comment.Content>
                    </Comment>
                )}
            </Comment.Group>
        </Comment.Content>
    </Comment>
}
function CommentAuthor({ _id, firstName, lastName, }) {
    return <Link href={`/users/${_id}`}>
        <a>
            <Comment.Author>{`${firstName} ${lastName}`}</Comment.Author>
        </a>
    </Link>
}
function CommentAvatar({ src }) {
    return <Comment.Avatar src={src || '/default-avatar.svg'}
        style={{ borderRadius: '50%', overflow: 'hidden', height: '2.5em', objectFit: 'cover' }}
    />
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
    const queryClient = useQueryClient();
    const onSubmit = e => {
        e.preventDefault();
        setResponse({ status: 'loading' });
        axios.post(`/api/comments/${postId}`, { text: e.target.text.value, replyTo })
            .then(() => {
                setResponse({ status: 'success' });
                e.target.reset();
            }).catch(error => {
                setResponse({ status: 'error', error });
            }).finally(() => {
                queryClient.invalidateQueries();
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

function EditComment({ _id, text }) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const onSubmit = e => {
        e.preventDefault();
        axios.put(`/api/comments/${_id}`, { text: e.target.text.value })
            .then(() => {
                setOpen(false);
            }).catch(error => {
                alert(error.response?.data.message || error.message);
            }).finally(() => {
                queryClient.invalidateQueries();
            });
    }
    return <Modal
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        trigger={<Comment.Action>Edit</Comment.Action>}
    >
        <Modal.Header>Edit comment</Modal.Header>
        <Modal.Content>
            <Form onSubmit={onSubmit}>
                <Form.TextArea defaultValue={text} name='text' required />
                <Button type='submit' primary>Save</Button>
            </Form>
        </Modal.Content>
    </Modal>
}

function DeleteComment({ _id }) {
    const queryClient = useQueryClient();
    const onClick = () => {
        if (confirm('Are you sure you want to delete this comment?')) {
            axios.delete(`/api/comments/${_id}`)
                .catch(error => {
                    alert(error.response?.data.message || error.message);
                }).finally(() => {
                    queryClient.invalidateQueries();
                });
        }
    }
    return <Comment.Action onClick={onClick}>
        Delete
    </Comment.Action>
}

function DropdownActions({ _id, userId, currentUserId }) {
    const queryClient = useQueryClient();
    const router = useRouter();
    if (userId !== currentUserId) return null;
    const onDelete = () => {
        if (confirm('Are you sure you want to delete?')) {
            axios.delete(`/api/posts/${_id}`)
                .then(() => {
                    router.back();
                })
                .catch(error => {
                    alert(error.response?.data.message || error.message);
                })
                .finally(() => {
                    queryClient.invalidateQueries();
                });
        }
    }
    return <Dropdown item icon='ellipsis vertical' className='pointing top right'>
        <Dropdown.Menu>
            <Link href={`/posts/edit/${_id}`}>
                <Dropdown.Item icon='edit' text='Edit' as='a' />
            </Link>
            <Dropdown.Item onClick={onDelete} icon='trash' text='Delete' />
        </Dropdown.Menu>
    </Dropdown>
}