import axios from "axios";
import mongoose from "mongoose";
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from "next/router";
import { useEffect } from "react";
import {
    Container,
    Divider,
    Dropdown,
    Header,
    Icon, Segment, Tab
} from "semantic-ui-react";
import io from 'socket.io-client';

export async function getServerSideProps({ req }) {
    if (!req.user) {
        return { redirect: { destination: '/', permanent: false } };
    }
    const currentUserId = req.user;
    const { Follow } = req.app.get('dbContext');
    let following = Follow.aggregate([
        { $match: { followerId: mongoose.Types.ObjectId(currentUserId) } },
        { $lookup: { from: 'users', localField: 'followingId', foreignField: '_id', as: 'users' } },
        { $set: { user: { $arrayElemAt: ['$users', 0] } } },
        { $project: { _id: '$user._id', firstName: '$user.firstName', lastName: '$user.lastName', avatar: '$user.avatar' } }
    ]);
    let followers = Follow.aggregate([
        { $match: { followingId: mongoose.Types.ObjectId(currentUserId) } },
        { $lookup: { from: 'users', localField: 'followerId', foreignField: '_id', as: 'users' } },
        { $set: { user: { $arrayElemAt: ['$users', 0] } } },
        { $project: { _id: '$user._id', firstName: '$user.firstName', lastName: '$user.lastName', avatar: '$user.avatar' } }
    ]);
    [following, followers] = await Promise.all([following, followers]);
    return {
        props: JSON.parse(JSON.stringify({ currentUserId, following, followers }))
    }
}

export default function People({ following, followers }) {
    const router = useRouter();
    useEffect(() => {
        const socket = io();
        socket.onAny(() => {
            router.replace(router.asPath, undefined, { scroll: false })
        });
        return () => socket.close();
    }, []);

    return <Container>
        <Head>
            <title>People</title>
        </Head>
        <Tab menu={{ secondary: true, pointing: true }}
            panes={[
                {
                    menuItem: 'Following',
                    render: () => <FollowingList following={following} />
                },
                {
                    menuItem: 'Followers',
                    render: () => <FollowerList followers={followers} />
                }
            ]}
        />
    </Container>
}

function FollowerList({ followers }) {
    return followers.length > 0
        ? <div style={{ maxWidth: '700px', 'margin': 'auto' }}>
            {followers.map(user =>
                <>
                    <div key={user._id} style={{ display: 'flex', alignItems: 'center' }}>
                        <img src={user.avatar || '/default-avatar.svg'} style={{ width: '4em', height: '4em', float: 'left', borderRadius: '50%', objectFit: 'cover' }} />
                        <Link href={`/users/${user._id}`}>
                            <a style={{ float: 'left', fontSize: 'x-large', marginLeft: '0.5em' }}>
                                {`${user.firstName} ${user.lastName}`}
                            </a>
                        </Link>
                        <Dropdown icon='bars' style={{ marginLeft: 'auto' }}>
                            <Dropdown.Menu style={{ right: 0, left: 'auto' }}>
                                <Dropdown.Item text='Message' icon='chat' />
                                <Dropdown.Item text='Follow' icon='user delete'
                                    onClick={() => axios.post(`/api/follow/${user._id}`)}
                                />
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                    <Divider />
                </>
            )}
        </div>
        : <Segment placeholder style={{ maxWidth: '700px', margin: 'auto' }}>
            <Header icon>
                <Icon name='user' />
                    You haven't had any followers.
                </Header>
        </Segment>
}

function FollowingList({ following }) {
    return following.length > 0
        ? <div style={{ maxWidth: '700px', margin: 'auto' }}>
            {following.map(user =>
                <>
                    <div key={user._id} style={{ display: 'flex', alignItems: 'center' }}>
                        <img src={user.avatar || '/default-avatar.svg'} style={{ width: '4em', height: '4em', float: 'left', borderRadius: '50%', objectFit: 'cover' }} />
                        <Link href={`/users/${user._id}`}>
                            <a style={{ float: 'left', fontSize: 'x-large', marginLeft: '0.5em' }}>
                                {`${user.firstName} ${user.lastName}`}
                            </a>
                        </Link>
                        <Dropdown icon='bars' style={{ marginLeft: 'auto' }}>
                            <Dropdown.Menu style={{ right: 0, left: 'auto' }}>
                                <Dropdown.Item text='Message' icon='chat' />
                                <Dropdown.Item text='Unfollow' icon='user delete'
                                    onClick={() => axios.delete(`/api/follow/${user._id}`)}
                                />
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                    <Divider />
                </>
            )}
        </div>
        : <Segment placeholder style={{ maxWidth: '700px', margin: 'auto' }}>
            <Header icon>
                <Icon name='user' />
                    You haven't followed anyone.
                </Header>
        </Segment>
}