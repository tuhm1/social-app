import axios from "axios";
import Link from "next/link";
import { useRouter } from 'next/router';
import { useQuery, useQueryClient } from "react-query";
import {
    Button, Divider,
    Header, Icon, Segment, Statistic
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
    const { user, followersCount, followed, postsCount, posts, currentUserId } = data;
    return <div style={{ maxWidth: '700px', margin: 'auto', padding: '1em' }}>
        {user
            ? <Info {...{ user, followersCount, followed, postsCount, currentUserId }} />
            : <UserNotFound />
        }
        <Divider />
        <div>
            {posts.map(p => <PostCard {...p} key={p._id} />)}
        </div>
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
            : <EditModal user={user} trigger={<Button icon='edit' content='Edit' />} />
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