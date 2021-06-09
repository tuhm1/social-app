import mongoose from 'mongoose';
import { Modal, Button, Divider, Icon } from 'semantic-ui-react';
import CreateConversation from './create';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import Head from 'next/head';
import { useQuery } from 'react-query';
import axios from 'axios';
import React from 'react';

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
        <div style={{ maxWidth: '700px', margin: 'auto', padding: '1em' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 'x-large' }}>Chat</span>
                <ButtonNewConversation style={{ marginLeft: 'auto' }} />
            </div>
            <Divider />
            <div>
                {conversations?.map(({ _id, title, users, lastMessage }) =>
                    <React.Fragment key={_id}>
                        <div style={{ display: 'flex' }}>
                            {
                                <img
                                    src={
                                        users.length === 2
                                            ? (users.filter(u => u._id !== currentUserId)[0].avatar || '/default-avatar.svg')
                                            : '/fa-users.svg'
                                    }
                                    style={{ width: '3em', height: '3em', objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }}
                                />
                            }
                            <div style={{ marginLeft: '0.5em', flexGrow: 1 }}>
                                <Link href={`/chat/conversations/${_id}`}>
                                    <a style={{ fontWeight: '700' }}>{
                                        title
                                        || users
                                            .filter(u => u._id !== currentUserId)
                                            .map(u => `${u.firstName} ${u.lastName}`)
                                            .join(', ')
                                    }</a>
                                </Link>
                                {lastMessage
                                    && <div style={{ display: 'flex' }}>
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
                            </div>
                        </div>
                        <Divider />
                    </React.Fragment>
                )}
            </div>
        </div>
    </>
}

function ButtonNewConversation({ style }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    return <Modal
        trigger={<Button icon='edit' primary style={style} />}
        content={<CreateConversation onCreated={conversationId => router.push(`/chat/conversations/${conversationId}`)} />}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        closeIcon
        size='small'
    />
}