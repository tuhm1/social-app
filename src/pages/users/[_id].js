import {
    Button, Container, Divider,
    Header, Image, Menu,
    Segment, Statistic, Icon
} from "semantic-ui-react";
import AuthModal from '../../components/AuthModal';
import EditModal from '../../components/users/UserEditModal';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import { useEffect } from 'react';

export default function Profile({ user, currentUserId }) {
    const router = useRouter();
    useEffect(() => {
        const socket = io();
        socket.onAny(() => {
            router.replace(router.asPath, undefined, { scroll: false });
        });
        return () => socket.close();
    }, [router]);
    return <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Menu inverted style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            {!currentUserId && <AuthModal trigger={<Menu.Item as={Button} icon='user' />} />}
        </Menu>
        <Container style={{ flexGrow: 1 }}>
            <Segment style={{
                maxWidth: '700px', margin: 'auto', display: 'flex',
                flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
            }}>
                {user
                    ? <>
                        <Image circular size='medium' src={user.avatar || '/default-avatar.svg'} />
                        <Header as='h1' icon>
                            {`${user.firstName} ${user.lastName}`}
                            <Header.Subheader style={{ fontSize: 'large' }}>
                                {user.bio}
                            </Header.Subheader>
                        </Header>
                        <div>
                            <Statistic value='123' label='followers' />
                            <Statistic value='456' label='posts' />
                        </div>
                        {currentUserId !== user._id
                            ? <div style={{ position: 'sticky', bottom: 0 }}>
                                <Button size='large'>Follow</Button>
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

export async function getServerSideProps({ req, params }) {
    const _id = params._id;
    const { User } = req.app.get('dbContext');
    let user = await User.findById(_id).lean();
    if (!user) {
        return { props: { user: null } };
    }
    user = { ...user, _id: user._id.toString() };
    const currentUserId = req.user ?? null;
    return { props: { user, currentUserId } };
};