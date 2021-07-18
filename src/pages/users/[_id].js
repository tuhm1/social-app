import axios from "axios";
import Head from 'next/head';
import Link from "next/link";
import { useRouter } from 'next/router';
import { useQuery, useQueryClient } from "react-query";
import {
    Button, Header, Icon, Segment, Statistic, Tab
} from "semantic-ui-react";
import PostCard from '../../components/posts/PostCard';
import EditModal from '../../components/users/UserEditModal';

export default function Profile() {
    const router = useRouter();
    const { _id } = router.query;
    const { data } = useQuery(`/api/user/${_id}`, () =>
        axios.get(`/api/user/${_id}`).then(res => res.data)
    );
    if (!data) return null;
    const { user, followersCount, followed, postsCount, currentUserId } = data;
    return <div style={{ maxWidth: '700px', margin: 'auto', padding: '1em', minHeight: '100%', background: 'white' }}>
        <Head>
            <title>{`${user.firstName} ${user.lastName}`}</title>
        </Head>
        {user
            ? <>
                <Info {...{ user, followersCount, followed, postsCount, currentUserId }} />
                <Tab menu={{ secondary: true, pointing: true }}
                    panes={[
                        { menuItem: 'Posts', render: () => <Posts userId={_id} /> },
                        { menuItem: 'Images', render: () => <Images userId={_id} /> },
                        { menuItem: 'Videos', render: () => <Videos userId={_id} /> },
                        { menuItem: 'Tagged', render: () => <Tagged userId={_id} /> }
                    ]}
                />
            </>
            : <UserNotFound />
        }
    </div>
};

function UserNotFound() {
    return <Segment placeholder>
        <Header as='h1' icon>
            <Icon name='search' />
            User not found
        </Header>
    </Segment>
}

function Info({ user, followersCount, followed, postsCount, currentUserId }) {
    const { _id, avatar, firstName, lastName, bio, email, username } = user;
    return <Segment
        style={{
            display: 'flex',
            flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
        }}
    >
        <img src={avatar || '/default-avatar.svg'} style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }} />
        <Header as='h1' icon>
            {`${firstName} ${lastName}`}
            <Header.Subheader>
                {email || `@${username}`}
            </Header.Subheader>
        </Header>
        <p style={{ textAlign: 'center', fontSize: 'large' }}>{bio}</p>
        <div>
            <Statistic value={followersCount} label='followers' />
            <Statistic value={postsCount} label='posts' />
        </div>
        {currentUserId !== _id
            ? <div>
                {!followed
                    ? <FollowButton _id={_id} />
                    : <UnfollowButton _id={_id} />
                }
                <Link href={`/chat/users/${_id}`}>
                    <Button as='a' primary>Message</Button>
                </Link>
            </div>
            : <div>
                <EditModal user={user} trigger={<Button icon='edit' content='Edit' />} />
                <Link href='/posts/create'>
                    <Button as='a' primary icon='plus' content='Post' />
                </Link>
            </div>
        }
    </Segment>
}

function FollowButton({ _id }) {
    const queryClient = useQueryClient();
    const onClick = () => {
        axios.post(`/api/follow/${_id}`)
            .catch(error => {
                alert(error.response?.data.message || error.message);
            })
            .finally(() => {
                queryClient.invalidateQueries();
            });
    };
    return <Button
        onClick={onClick}
        icon='add user'
        content='Follow'
        primary
    />
}

function UnfollowButton({ _id }) {
    const queryClient = useQueryClient();
    const onClick = () => {
        if (confirm('Are you sure you want to unfollow')) {
            axios.delete(`/api/follow/${_id}`)
                .catch(error => {
                    alert(error.response?.data.message || error.message);
                })
                .finally(() => {
                    queryClient.invalidateQueries();
                });
        }
    }
    return <Button
        onClick={onClick}
        icon='user delete'
        content='Unfollow'
        basic
    />
}

function Posts({ userId }) {
    const { data: posts } = useQuery(`/api/posts/user/posts/${userId}`, () =>
        axios.get(`/api/posts/user/posts/${userId}`).then(res => res.data)
    );
    return <div>
        {posts?.map(p => <PostCard key={p._id} {...p} />)}
    </div>
}

function Images({ userId }) {
    const { data: posts } = useQuery(`/api/posts/user/images/${userId}`, () =>
        axios.get(`/api/posts/user/images/${userId}`).then(res => res.data)
    );
    return <div>
        {posts?.map(p =>
            <Link href={`/posts/details/${p._id}`} key={p.files._id}>
                <a>
                    <img src={p.files.url} style={{ width: '33%', aspectRatio: '1/1', objectFit: 'cover' }} />
                </a>
            </Link>
        )}
    </div>
}

function Videos({ userId }) {
    const { data: posts } = useQuery(`/api/posts/user/videos/${userId}`, () =>
        axios.get(`/api/posts/user/videos/${userId}`).then(res => res.data)
    );
    return <div>
        {posts?.map(p =>
            <Link href={`/posts/details/${p._id}`} key={p.files._id}>
                <a>
                    <video src={p.files.url} style={{ width: '33%', aspectRatio: '1/1', objectFit: 'cover' }} controls />
                </a>
            </Link>
        )}
    </div>
}

function Tagged({ userId }) {
    const { data: posts } = useQuery(`/api/posts/user/tagged/${userId}`, () =>
        axios.get(`/api/posts/user/tagged/${userId}`).then(res => res.data)
    );
    return <div>
        {posts?.map(p =>
            <Link href={`/posts/details/${p._id}`} key={p.files._id}>
                <a>
                    <img src={p.files.url} style={{ width: '33%', aspectRatio: '1/1', objectFit: 'cover' }} controls />
                </a>
            </Link>
        )}
    </div>
}