import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { Container, Icon, Label, Menu, Sidebar } from 'semantic-ui-react';
import AuthModal from '../AuthModal';
import PostCreateModal from '../posts/PostCreateModal';

export default function AppShell({ currentUserId, children }) {
    const [sidebar, setSidebar] = useState(false);

    return <>
        <Head>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <div>
            <Menu
                size='large'
                inverted
                style={{ position: 'sticky', top: 0, zIndex: 1, margin: 0 }}
            >
                <Container>
                    <Menu.Item
                        icon='sidebar'
                        onClick={() => setSidebar(!sidebar)}
                    />
                    <Menu.Item header>Socialize</Menu.Item>
                </Container>
            </Menu>
            <Sidebar
                as={SidebarMenu}
                currentUserId={currentUserId}
                visible={sidebar}
                onHide={() => setSidebar(false)}
                animation='overlay'
                style={{ height: '100vh' }}
                width='thin'
            />
            {children}
        </div>
    </>
}

function SidebarMenu({ currentUserId, ...menuProps }) {
    const { data: notSeenConversations } = useQuery('/api/notifications/chat', () =>
        axios.get('/api/notifications/chat').then(res => res.data)
    );
    return <Menu inverted vertical icon='labeled' {...menuProps}>
        {currentUserId
            && <PostCreateModal trigger={<Menu.Item icon='plus' content='Post' />} />
        }
        <Link href='/'>
            <Menu.Item as='a' icon='home' content='Home' />
        </Link>
        {!currentUserId
            && <AuthModal trigger={<Menu.Item as='a' icon='user' content='Log In' />} />
        }
        <Menu.Item
            position='right'
            icon='search'
            content='Search'
        />
        {currentUserId &&
            <>
                <Link href='/chat'>
                    <Menu.Item as='a'>
                        <Icon name='chat' />
                        Message
                        {notSeenConversations?.length > 0 && <Label color='red'>{notSeenConversations.length}</Label>}
                    </Menu.Item>
                </Link>
                <Menu.Item as='a'>
                    <Icon name='bell' />
                    Notification
                </Menu.Item>
                <Link href='/people'>
                    <Menu.Item as='a' icon='group' name='People' />
                </Link>
                <Menu.Item icon='user' content='Profile' />
                <Menu.Item icon='log out' content='Log Out' as='a' />
            </>
        }
    </Menu>
}

function useMediaMatch(query) {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => {
            setMatches(media.matches);
        };
        media.addListener(listener);
        return () => media.removeListener(listener);
    }, [matches, query]);
    return matches;
}

