import axios from "axios";
import { useEffect, useRef, Fragment, useState } from "react";
import { Button, Divider, Form, Modal, Segment } from "semantic-ui-react";
import { io } from "socket.io-client";
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Picker } from 'emoji-mart';
import "emoji-mart/css/emoji-mart.css";
import Link from 'next/link';
import Carousel from '../../../components/Carousel';
import FilePicker from '../../../components/FilePicker';
import { useQuery, useQueryClient } from "react-query";

export default function Conversation() {
    const router = useRouter();
    const { conversationId } = router.query;
    const { data: messages, refetch } = useQuery(`/api/chat/conversations/${conversationId}`, () =>
        axios.get(`/api/chat/conversations/${conversationId}`).then(res => res.data)
    );
    const queryClient = useQueryClient();
    useEffect(() => {
        if (messages) {
            const notSeenMessageIds = messages.filter(m => !m.seen).map(m => m._id);
            if (notSeenMessageIds.length > 0) {
                axios.put(`/api/notifications/chat`, notSeenMessageIds)
                    .then(() => queryClient.invalidateQueries());
            }
        }
    }, [messages]);
    useEffect(() => {
        const socket = io();
        socket.onAny(() => refetch());
        return () => socket.close();
    }, []);
    return <>
        <Head>
            <title>Chat - {`@${conversationId}`}</title>
        </Head>
        <div style={{ maxWidth: '700px', margin: 'auto' }}>
            <div style={{ padding: '1em' }}>
                {messages?.map(m =>
                    <Fragment key={m._id}>
                        <Message {...m} />
                        <Divider />
                    </Fragment>)
                }
            </div>
            <ChatForm conversationId={conversationId} />
        </div>
    </>
}

function Message({ sender, text, files, createdAt }) {
    return <div style={{ display: 'flex' }}>
        <img src={sender.avatar || '/default-avatar.svg'}
            style={{ width: '3em', height: '3em', objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }}
        />
        <div style={{ marginLeft: '0.5em', flexGrow: 1, overflow: 'auto' }}>
            <Link href={`/users/${sender._id}`}>
                <a style={{ fontSize: '16px', fontWeight: 700 }}>
                    {`${sender.firstName} ${sender.lastName}`}
                </a>
            </Link>
            <span style={{ fontSize: '0.875em', color: 'rgba(0,0,0,.4)', marginLeft: '0.5em' }}>
                {new Date(createdAt).toLocaleString()}
            </span>
            <p style={{ fontSize: '16px' }}>
                {text}
            </p>
            {files?.length > 0 && <Carousel files={files} />}
        </div>
    </div>
}

function ChatForm({ conversationId }) {
    const [files, setFiles] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const textareaRef = useRef(null);
    const postMessage = () => {
        const form = new FormData();
        form.append('text', text);
        files.forEach(file => form.append('files', file));
        setLoading(true);
        axios.post(`/api/chat/${conversationId}`, form)
            .then(() => {
                setText('');
                setFiles([]);
            })
            .catch(alert)
            .finally(() => {
                setLoading(false);
            });
    }
    return <Segment
        style={{ position: 'sticky', bottom: 0 }}>
        <Form
            onSubmit={e => {
                e.preventDefault();
                postMessage();
            }}
            loading={loading}
        >
            <Form.Field>
                <textarea value={text} onChange={e => setText(e.target.value)}
                    ref={textareaRef} rows={1} onKeyPress={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            postMessage();
                        }
                    }}
                />
            </Form.Field>
            <div style={{ display: 'flex' }}>
                <FilePickerPopup
                    value={files}
                    onChange={setFiles}
                    trigger={
                        <Button basic type='button' icon='images' primary={files.length > 0}
                            content={files.length > 0 ? String(files.length) : null}
                        />
                    }
                />
                <EmojiPickerPopup
                    onSelect={e => {
                        setText(
                            text.substring(0, textareaRef.current.selectionStart)
                            + e.native
                            + text.substring(textareaRef.current.selectionEnd)
                        );
                    }}
                    trigger={<Button icon='smile outline' basic type='button' />}
                />
                <Button type='submit' icon='send' primary style={{ marginLeft: 'auto' }} />
            </div>
        </Form >
    </Segment>
}

function EmojiPickerPopup({ onSelect, trigger }) {
    const [open, setOpen] = useState(false);
    return <Modal
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        closeIcon
        content={
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1em' }}>
                <Picker
                    onSelect={e => {
                        setOpen(false);
                        onSelect(e);
                    }}
                />
            </div>
        }
        trigger={trigger}
        size='mini'
        basic
    />
}

function FilePickerPopup({ value, onChange, trigger }) {
    const [open, setOpen] = useState(false);
    return <Modal
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        closeIcon
        trigger={trigger}
        size='small'
    >
        <Modal.Header>Select files</Modal.Header>
        <Modal.Content scrolling>
            <FilePicker value={value} onChange={onChange} image video multiple />
        </Modal.Content>
        <Modal.Actions>
            <Button primary basic onClick={() => setOpen(false)}>
                Done
            </Button>
        </Modal.Actions>
    </Modal>
}