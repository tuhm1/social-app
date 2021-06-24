import { useQuery } from "react-query";
import axios from 'axios';
import Error from 'next/error';
import { Feed, Header } from 'semantic-ui-react';
import Link from 'next/link';
import React from 'react';

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
        <Header as='h2'>Notifications</Header>
        <Feed>
            {data.map(n =>
                n.type === 'follow'
                    ? <FollowNotification {...n.follower} />
                    : null
            )}
        </Feed>
    </div>
}

function FollowNotification({ _id, firstName, lastName, avatar }) {
    return <Feed.Event>
        <Feed.Label image={avatar || '/default-avatar.svg'} />
        <Feed.Content>
            <Feed.Summary>
                <Link href={`/users/${_id}`}>
                    <a>{`${firstName} ${lastName}`}</a>
                </Link> followed you.
            </Feed.Summary>
        </Feed.Content>
    </Feed.Event>
}
