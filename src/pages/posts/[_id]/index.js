import { Container, Image, Button, Segment, Header, Icon } from "semantic-ui-react";
import Link from 'next/link';
import { useRouter } from 'next/router';
import mongoose from "mongoose";
import GalleryWidget from '../../_components/GalleryWidget';

export default function Post({ post }) {
    if (!post) {
        return <PostNotFound />
    }
    const { user, text, files } = post;
    return <div style={{ maxWidth: '700px', margin: 'auto' }}>
        <div>
            <Image src={user.avatar || '/default-avatar.svg'} avatar style={{ height: '3em', width: '3em' }} />
            <Link href={`/user/${user._id}`}>
                <a style={{ fontSize: 'large' }}>
                    {`${user.firstName} ${user.lastName}`}
                </a>
            </Link>
        </div>
        <p style={{ fontSize: 'large' }}>
            {text}
        </p>
        {files?.length > 0 && <GalleryWidget files={files} />}
        <Button icon='like' />
        <Button icon='comment' />
    </div>
}

export async function getServerSideProps({ req, params: { _id } }) {
    const { Post } = req.app.get('dbContext');
    const result = await Post.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(_id) } },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $set: { user: { $arrayElemAt: ['$user', 0] } } }
    ]);
    const post = result.length > 0 ? result[0] : null;
    return {
        props: {
            currentUserId: req.user ?? null,
            post: JSON.parse(JSON.stringify(post))
        }
    };
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