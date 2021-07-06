import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { Container, Icon, Label, Menu, Sidebar } from 'semantic-ui-react';
import AuthModal from '../AuthModal';

export default function TopMenu({ children }) {
    const { data: currentUserId } = useQuery('/api/auth/me', () =>
        axios.get('/api/auth/me').then(res => res.data)
    );
    const [sidebar, setSidebar] = useState(false);

    return <>
        <Head>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Menu
                size='large'
                inverted
                color='teal'
                style={{ margin: 0 }}
            >
                <Container>
                    <Menu.Item
                        icon='sidebar'
                        onClick={() => setSidebar(!sidebar)}
                    />
                    <Link href='/'>
                        <Menu.Item header as='a'>Socialize</Menu.Item>
                    </Link>
                </Container>
            </Menu>
            <Sidebar
                as={Menu}
                visible={sidebar}
                onHide={() => setSidebar(false)}
                animation='overlay'
                style={{ height: '100vh', overflow: 'visible' }}
                width='thin'
                inverted
                icon='labeled'
                vertical
            >
                <Link href='/'>
                    <Menu.Item as='a' icon='home' content='Home' />
                </Link>
                {!currentUserId
                    && <AuthModal trigger={<Menu.Item as='a' icon='user' content='Log In' />} />
                }
                {currentUserId &&
                    <>
                        <MessageItem />
                        <NotificationItem />
                        <PeopleItem />
                        <Link href={`/users/${currentUserId}`}>
                            <Menu.Item as='a' icon='user' content='Profile' />
                        </Link>
                    </>
                }
            </Sidebar>
            <div style={{ overflow: 'auto', flexGrow: 1 }}>
                {children}
            </div>
        </div>
    </>
}

function NotificationItem() {
    const { data: count } = useQuery('/api/notifications/general/count', () =>
        axios.get('/api/notifications/general/count').then(res => res.data)
    );
    return <Link href='/notifications'>
        <Menu.Item as='a'>
            <Icon name='bell' style={{ position: 'relative' }}>
                {count > 0
                    && <Label color='red' floating circular size='mini'>
                        {count}
                    </Label>
                }
            </Icon>
            Notifications
        </Menu.Item>
    </Link>
}

function MessageItem() {
    const { data: notifications } = useQuery('/api/notifications/chat', () =>
        axios.get('/api/notifications/chat').then(res => res.data)
    );
    return <Link href='/chat'>
        <Menu.Item as='a'>
            <Icon name='chat' style={{ position: 'relative' }}>
                {notifications?.length > 0
                    && <Label color='red' floating circular size='mini'>
                        {new Set(notifications.map(n => n.message.conversationId)).size}
                    </Label>
                }
            </Icon>
            Message
        </Menu.Item>
    </Link>
}

function PeopleItem() {
    const { data: count } = useQuery('/api/notifications/follow/count', () =>
        axios.get('/api/notifications/follow/count').then(res => res.data)
    );
    return <Link href='/people'>
        <Menu.Item as='a'>
            <Icon name='group' style={{ position: 'relative' }}>
                {count > 0
                    && <Label color='red' floating circular size='mini'>
                        {count}
                    </Label>
                }
            </Icon>
            People
        </Menu.Item>
    </Link>
}