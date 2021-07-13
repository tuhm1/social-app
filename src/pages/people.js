import mongoose from "mongoose";
import Head from 'next/head';
import Link from 'next/link';
import {
    Header,
    Icon, Image, List, Segment, Tab
} from "semantic-ui-react";

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
    return <div style={{ maxWidth: '700px', 'margin': 'auto', padding: '1em', minHeight: '100%', background: 'white' }}>
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
    </div>
}

function FollowerList({ followers }) {
    return followers.length > 0
        ? <List selection verticalAlign='middle'>
            {followers.map(user =>
                <Link key={user._id} href={`/users/${user._id}`}>
                    <List.Item>
                        <Image src={user.avatar || '/default-avatar.svg'} avatar />
                        <List.Content>
                            <List.Header as='a'>{`${user.firstName} ${user.lastName}`}</List.Header>
                        </List.Content>
                    </List.Item>
                </Link>
            )}
        </List>
        : <Segment placeholder>
            <Header icon>
                <Icon name='user' />
                You haven't had any followers.
            </Header>
        </Segment>
}

function FollowingList({ following }) {
    return following.length > 0
        ? <List selection verticalAlign='middle'>
            {following.map(user =>
                <Link href={`/users/${user._id}`} key={user._id} >
                    <List.Item>
                        <Image avatar src={user.avatar || '/default-avatar.svg'} />
                        <List.Content>
                            <List.Header as='a'>{`${user.firstName} ${user.lastName}`}</List.Header>
                        </List.Content>
                    </List.Item>
                </Link>
            )}
        </List>
        : <Segment placeholder>
            <Header icon>
                <Icon name='user' />
                You haven't followed anyone.
            </Header>
        </Segment>
}