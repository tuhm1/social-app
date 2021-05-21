import {
    Button, Container, Divider,
    Header, Image, Menu,
    Segment, Statistic, Icon, Modal, Message, Confirm
} from "semantic-ui-react";
import AuthModal from '../../components/AuthModal';
import EditModal from '../../components/users/UserEditModal';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import { useEffect, useState } from 'react';
import axios from "axios";

export async function getServerSideProps({ req, params }) {
    const currentUserId = req.user ?? null;
    const _id = params._id;
    const { User, Follow } = req.app.get('dbContext');
    const [user, followersCount, followed] = await Promise.all([
        User.findById(_id, { firstName: 1, lastName: 1, avatar: 1, bio: 1 }).lean(),
        Follow.countDocuments({ followingId: _id }),
        currentUserId && Follow.exists({ followingId: _id, followerId: currentUserId })
    ])
    return {
        props: JSON.parse(JSON.stringify({ user, followersCount, followed, currentUserId }))
    };
};

export default function Profile({ user, followersCount, followed, currentUserId }) {
    const router = useRouter();
    useEffect(() => {
        const socket = io();
        socket.onAny(() => {
            router.replace(router.asPath, undefined, { scroll: false });
        });
        return () => socket.close();
    }, [router]);
    return <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Container style={{ flexGrow: 1 }}>
            <Segment style={{
                maxWidth: '700px', margin: 'auto', display: 'flex',
                flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
            }}>
                {user
                    ? <>
                        <img src={user.avatar || '/default-avatar.svg'} style={{ width: '300px', height: '300px', borderRadius: '50%', objectFit: 'cover' }} />
                        <Header as='h1' icon>
                            {`${user.firstName} ${user.lastName}`}
                            <Header.Subheader style={{ fontSize: 'large' }}>
                                {user.bio}
                            </Header.Subheader>
                        </Header>
                        <div>
                            <Statistic value={followersCount} label='followers' />
                            <Statistic value='456' label='posts' />
                        </div>
                        {currentUserId !== user._id
                            ? <div>
                                {!followed
                                    ? <FollowButton _id={user._id} />
                                    : <UnfollowButton _id={user._id} />
                                }
                                <Button size='large'>Message</Button>
                            </div>
                            : <EditModal user={user} trigger={<Button icon='edit' content='Edit' />} />
                        }
                    </>
                    : <Header as='h1' icon>
                        <Icon name='search' />
                        User not found
                    </Header>
                }

            </Segment>
            <Divider />
        </Container>
    </div>
};


function FollowButton({ _id }) {
    const [error, setError] = useState();
    const onClick = () => {
        axios.post(`/api/follow/${_id}`).catch(setError)
    };
    return <>
        <Button
            onClick={onClick}
            icon='add user'
            content='Follow'
            primary
        />
        {error && <FollowError error={error} onClose={() => setError()} />}
    </>

}
function UnfollowButton({ _id }) {
    const [error, setError] = useState();
    const [confirm, setConfirm] = useState(false);
    const unfollow = () => {
        axios.delete(`/api/follow/${_id}`).catch(setError);
    }
    return <>
        <Button
            onClick={() => setConfirm(true)}
            icon='user delete'
            content='Unfollow'
            basic
        />
        {confirm && <Confirm open={true} onConfirm={unfollow} content='Are you sure you want to unfollow?' />}
        {error && <FollowError error={error} onClose={() => setError()} />}
    </>
}
function FollowError({ error, onClose }) {
    let message = error.response?.data?.errors?.followerId?.kind === 'required'
        ? 'Please login first'
        : error.message;
    return <Modal open={true} closeIcon onClose={onClose}>
        <Modal.Content>
            <Message error header='Error' content={message} />
        </Modal.Content>
    </Modal>
}