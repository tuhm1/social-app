import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import { useQuery } from 'react-query';
import { Image, Label, List, Menu } from 'semantic-ui-react';

export default function ChatIndex() {
    const { data: currentUserId } = useQuery('/api/auth/me', () =>
        axios.get('/api/auth/me').then(res => res.data)
    );
    const { data: conversations } = useQuery('/api/conversations', () =>
        axios.get('/api/chat/conversations').then(res => res.data)
    );
    return <>
        <Head>
            <title>Chat</title>
        </Head>
        <div style={{ maxWidth: '800px', margin: 'auto', padding: '1em' }}>
            <Menu secondary pointing>
                <Menu.Item header>Chat</Menu.Item>
                <Link href='/chat/create'>
                    <Menu.Item position='right' as='a' icon='plus' />
                </Link>
            </Menu>
            <List selection>
                {conversations?.map(({ _id, title, users, lastMessage, newsCount }) =>
                    <Link href={`/chat/conversations/${_id}`} key={_id} >
                        <List.Item style={{ display: 'flex' }}>
                            {
                                <Image
                                    src={
                                        users.length === 2
                                            ? (users.filter(u => u._id !== currentUserId)[0].avatar || '/default-avatar.svg')
                                            : '/fa-users.svg'
                                    }
                                    avatar
                                />
                            }
                            <List.Content style={{ flexGrow: 1 }}>
                                <List.Header as='a'>{
                                    title
                                    || users
                                        .filter(u => u._id !== currentUserId)
                                        .map(u => `${u.firstName} ${u.lastName}`)
                                        .join(', ')
                                }</List.Header>
                                <List.Description>
                                    {lastMessage
                                        && <div style={{ display: 'flex' }}>
                                            {newsCount && <Label color='red' circular size='mini'>{newsCount}</Label>}
                                            <div style={{ flexGrow: 1 }}>
                                                {lastMessage.files.length > 0
                                                    ? <><a>{lastMessage.firstName}</a> sent some files</>
                                                    : <><a>{lastMessage.sender.firstName}</a>: {lastMessage.text}</>
                                                }
                                            </div>

                                            <span style={{ fontSize: '0.875em', color: 'rgba(0,0,0,.4)', marginLeft: '0.5em' }}>
                                                {new Date(lastMessage.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    }
                                </List.Description>
                            </List.Content>
                        </List.Item>
                    </Link>
                )}
            </List>
        </div>
    </>
}