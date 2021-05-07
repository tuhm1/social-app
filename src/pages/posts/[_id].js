import { useState } from 'react';
import {
    Container, Image, Button, Segment, Header, Icon
} from "semantic-ui-react";
import Link from 'next/link';
import { useRouter } from 'next/router';
import mongoose from "mongoose";
import Carousel from '../../components/Carousel';

export async function getServerSideProps({ req, params: { _id } }) {
    const { Post } = req.app.get('dbContext');
    const result = await Post.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(_id) } },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'users' } },
        { $lookup: { from: 'likes', localField: '_id', foreignField: 'postId', as: 'likes' } },
        { $set: { user: { $arrayElemAt: ['$users', 0] } } },
        {
            $project: {
                _id: 1, text: 1, files: 1, 'user._id': 1,
                'user.firstName': 1, 'user.lastName': 1, 'likes.userId': 1
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
    if (!post) {
        return <PostNotFound />
    }
    const { _id, text, files, user, likes } = post;
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
        <LikeButton postId={_id} likes={likes} currentUserId={currentUserId} />
    </div>
}

function LikeButton({ postId, likes, currentUserId }) {
    const router = useRouter();
    const [response, setResponse] = useState({ status: 'idle' });
    const liked = likes.some(l => l.userId === currentUserId);
    if (liked) {
        const onClick = () => {
            setResponse({ status: 'loading' });
            axios.delete(`/api/likes/${postId}`)
                .then(() => {
                    setResponse({ status: 'success' });
                    router.replace(router.asPath, undefined, { scroll: false });
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
                router.replace(router.asPath, undefined, { scroll: false });
            }).catch(error => {
                setResponse({ status: 'error', error });
            });
    };
    return <Button
        onClick={onClick}
        content={likes.length}
        icon='like'
        loading={response.status === 'loading'}
    />
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