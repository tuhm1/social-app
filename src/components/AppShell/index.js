import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon, Menu, Sidebar } from 'semantic-ui-react';
import AuthModal from '../AuthModal';
import PostCreateModal from '../posts/PostCreateModal';

export default function AppShell({ currentUserId, children }) {
    const small = useMediaMatch('only screen and (max-width: 768px)');
    return <>
        <Head>
            <link rel="icon" href="/favicon.ico" />
        </Head>
        {small
            ? <SmallAppShell
                currentUserId={currentUserId}
                children={children}
            />
            : <LargeAppShell
                currentUserId={currentUserId}
                children={children}
            />
        }

    </>
}

function SmallAppShell({ currentUserId, children }) {
    const [sidebar, setSidebar] = useState(false);
    return <div>
        <Menu inverted style={{ position: 'sticky', top: 0, zIndex: 1, margin: 0 }}>
            <Menu.Item
                icon='sidebar'
                onClick={() => setSidebar(!sidebar)}
                position='right'
            />
        </Menu>
        <Sidebar
            as={SidebarMenu}
            currentUserId={currentUserId}
            visible={sidebar}
            onHide={() => setSidebar(false)}
            animation='overlay'
            style={{ height: '100vh' }}
        />
        {children}
    </div>
}

function LargeAppShell({ currentUserId, children }) {
    return <div style={{ display: 'flex' }}>
        <SidebarMenu
            currentUserId={currentUserId}
            style={{ position: 'sticky', top: 0, height: '100vh', margin: 0 }}
        />
        <div style={{ flexGrow: 1 }}>
            {children}
        </div>
    </div>
}

function SidebarMenu({ currentUserId, ...menuProps }) {
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
                <Menu.Item as='a'>
                    <Icon name='chat' />
                    Message
                </Menu.Item>
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
