import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Container, Icon, Label, Menu, Sidebar } from 'semantic-ui-react';
import AuthModal from '../AuthModal';

export default function TopMenu({ children }) {
    const { data: currentUserId } = useQuery('/api/auth/me', () =>
        axios.get('/api/auth/me').then(res => res.data)
    );
    const { data: isAdmin } = useQuery('/api/auth/me', () =>
        axios.get('/api/admin/isadmin').then(res => res.data)
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
                    <Menu.Menu position='right'>

                    </Menu.Menu>
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
                        <Link href='/people'>
                            <Menu.Item as='a' icon='group' content='People' />
                        </Link>
                        <Link href={`/users/${currentUserId}`}>
                            <Menu.Item as='a' icon='user' content='Profile' />
                        </Link>
                        {isAdmin
                            && <Link href='/admin'>
                                <Menu.Item as='a' icon='cogs' content='Admin' />
                            </Link>
                        }
                        <LogOutItem />
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
    const { data: count } = useQuery('/api/notifications/chat/count', () =>
        axios.get('/api/notifications/chat/count').then(res => res.data)
    );
    return <Link href='/chat'>
        <Menu.Item as='a'>
            <Icon name='chat' style={{ position: 'relative' }}>
                {count > 0
                    && <Label color='red' floating circular size='mini'>
                        {count}
                    </Label>
                }
            </Icon>
            Message
        </Menu.Item>
    </Link>
}

function LogOutItem() {
    const queryClient = useQueryClient();
    const onClick = () => {
        axios.post('/api/auth/logout')
            .then(() => queryClient.invalidateQueries());
    }
    return <Menu.Item icon='log out' content='Log Out' onClick={onClick} />
}

