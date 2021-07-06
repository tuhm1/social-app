import axios from "axios";
import { useEffect, useRef, Fragment, useState, useCallback } from "react";
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
import css from '../../../styles/Conversation.module.css';

export default function Conversation() {
    const router = useRouter();
    const { conversationId } = router.query;
    const [peer, socket] = useRTC(conversationId);
    return <>
        <Head>
            <title>Chat - {`@${conversationId}`}</title>
        </Head>
        <div className={css.page}>
            <div className={css['media-buttons']}>
                <ButtonVideo peer={peer} socket={socket} />
                <ButtonAudio peer={peer} socket={socket} />
            </div>
            <div className={css.container}>
                {peer && <Tracks peer={peer} socket={socket} />}
                <MessageChat conversationId={conversationId} />
            </div>
        </div>
    </>
}

function MessageChat({ conversationId }) {
    const { data: messages, refetch } = useQuery(`/api/chat/conversations/${conversationId}`, () =>
        axios.get(`/api/chat/conversations/${conversationId}`).then(res => res.data)
    );
    const { data: notifications } = useQuery(`/api/notifications/chat`, () =>
        axios.get(`/api/notifications/chat`).then(res => res.data)
    );
    const queryClient = useQueryClient();
    useEffect(() => {
        if (messages && notifications) {
            const seen = notifications
                .filter(n => messages.some(m => m._id === n.messageId))
                .map(n => n._id);
            if (seen.length > 0) {
                axios.put(`/api/notifications`, seen)
                    .then(() => queryClient.invalidateQueries());
            }
        }
    }, [messages]);
    useEffect(() => {
        const socket = io();
        socket.onAny(() => refetch());
        return () => socket.close();
    }, []);
    return <div className={css['message-chat']}>
        <div className={css['message-chat-1']}>
            <div className={css.messages}>
                {messages?.map(m =>
                    <Fragment key={m._id}>
                        <Message {...m} />
                        <Divider />
                    </Fragment>)
                }
            </div>
            <ChatForm conversationId={conversationId} />
        </div>
    </div>
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
    return <Form
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
    </Form>
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

function useRTC(conversationId) {
    const [peer, setPeer] = useState();
    const [socket, setSocket] = useState();
    useEffect(() => {
        const socket = io();
        const peer = new RTCPeerConnection({ 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] });
        peer.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true })
            .then(async offer => {
                await peer.setLocalDescription(offer);
                socket.emit('chatrtc', conversationId, offer, answer => {
                    peer.setRemoteDescription(answer);
                });
                peer.onnegotiationneeded = async () => {
                    if (peer.signalingState === 'have-local-offer') return;
                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);
                    socket.emit('negotiationneeded', offer, answer => {
                        peer.setRemoteDescription(answer);
                    });
                };
                socket.on('negotiationneeded', async (offer, _return) => {
                    await peer.setRemoteDescription(offer);
                    const answer = await peer.createAnswer();
                    await peer.setLocalDescription(answer);
                    _return(answer);
                });
                peer.onicecandidate = e => socket.emit('icecandidate', e.candidate);
                socket.on('icecandidate', candidate => peer.addIceCandidate(candidate));
            });
        setSocket(socket);
        setPeer(peer);
        return () => {
            socket.close();
            peer.close();
        };
    }, [conversationId]);
    return [peer, socket];
}

function Tracks({ peer, socket }) {
    const [tracks, setTracks] = useState();
    useEffect(() => {
        setTracks([]);
        peer.ontrack = e => {
            setTracks(tracks => [...tracks, e.track]);
        };
        const onRemoveTrack = i => {
            const removedTrack = peer.getTransceivers()[i].receiver.track;
            setTracks(tracks => tracks.filter(t => t !== removedTrack));
        };
        socket.on('removetrack', onRemoveTrack);
        return () => {
            peer.ontrack = null;
            socket.off('removetrack', onRemoveTrack);
        }
    }, [peer, socket]);
    return <div className={css.tracks}>
        {tracks?.map(t => <Track track={t} key={t.id} />)}
    </div>
}

function Track({ track }) {
    const onDOM = useCallback(dom => {
        dom && (dom.srcObject = new MediaStream([track]))
    }, [track]);
    return track.kind === 'video'
        ? <video ref={onDOM} autoPlay className={css.track} />
        : <audio ref={onDOM} autoPlay className={css.track} />
}

function ButtonVideo({ peer, socket }) {
    const [video, setVideo] = useState();
    useEffect(() => {
        if (video) {
            const sendVideo = async () => {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                const track = stream.getTracks()[0];
                const sender = peer.addTrack(track);
                return () => {
                    track.stop();
                    peer.removeTrack(sender);
                    peer.getTransceivers().forEach((tc, i) => {
                        tc.sender === sender && socket.emit('removetrack', i);
                    });
                }
            };
            const pCleanup = sendVideo();
            return () => pCleanup.then(cleanup => cleanup());
        }
    }, [video, peer, socket]);
    return <Button
        onClick={() => setVideo(!video)}
        basic
        icon='video camera'
        color={video && 'red'}
    />
}

function ButtonAudio({ peer, socket }) {
    const [audio, setAudio] = useState();
    useEffect(() => {
        if (audio) {
            const sendAudio = async () => {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const track = stream.getTracks()[0];
                const sender = peer.addTrack(track);
                return () => {
                    track.stop();
                    peer.removeTrack(sender);
                    peer.getTransceivers().forEach((tc, i) => {
                        tc.sender === sender && socket.emit('removetrack', i);
                    });
                }
            };
            const pCleanup = sendAudio();
            return () => pCleanup.then(cleanup => cleanup());
        }
    }, [audio, peer, socket]);
    return <Button
        onClick={() => setAudio(!audio)}
        basic
        icon='microphone'
        color={audio && 'red'}
    />
}