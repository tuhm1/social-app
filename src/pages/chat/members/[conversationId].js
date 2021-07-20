import axios from "axios";
import Error from 'next/error';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Button, Dimmer, Form, Image, Input, Label, List, Loader, Menu, Modal } from "semantic-ui-react";

export default function Members() {
    const router = useRouter();
    const { conversationId } = router.query;
    const { data, error } = useQuery(`/api/chat/members/${conversationId}`, () =>
        axios.get(`/api/chat/members/${conversationId}`).then(res => res.data)
    );
    const queryClient = useQueryClient();
    const [openSearchModal, setOpenSearchModal] = useState(false);
    if (error) {
        return <Error
            statusCode={error.response?.status}
            title={error.response?.data.message || error.message}
        />
    }
    const removeUser = userId => {
        if (confirm('Are you sure you want to remove this user from this conversation?')) {
            axios.post(`/api/chat/delete-member`, { conversationId, userId })
                .finally(() => queryClient.invalidateQueries());
        }
    };
    const addUser = userId => {
        axios.post(`/api/chat/add-member`, { conversationId, userId })
            .finally(() => queryClient.invalidateQueries());
    };
    return <>
        <Head>
            <title>Members</title>
        </Head>
        {data
            ? <div style={{ maxWidth: '700px', padding: '1em', margin: 'auto', background: 'white', minHeight: '100%' }}>
                <Menu secondary pointing>
                    <Menu.Item header>Members</Menu.Item>
                    {data.creatorId === data.currentUserId
                        && <Menu.Item position='right' icon='plus' onClick={() => setOpenSearchModal(true)} />
                    }
                </Menu>
                {data.creatorId == data.currentUserId && openSearchModal
                    && <AddUserModal
                        onUser={userId => {
                            setOpenSearchModal(false);
                            addUser(userId);
                        }}
                        onClose={() => setOpenSearchModal(false)}
                    />
                }
                <List>
                    {data.users.map(u =>
                        <List.Item key={u._id} >
                            <Image avatar src={u.avatar || '/default-avatar.svg'} />
                            <List.Content>
                                <Link href={`/users/${u._id}`}>
                                    <List.Header as='a'>{`${u.firstName} ${u.lastName}`}</List.Header>
                                </Link>
                                <List.Description>
                                    {u.username && <div>{`@${u.username}`}</div>}
                                    {u.email && <div>{u.email}</div>}
                                    {data.creatorId === u._id && <Label size='mini' color='teal'>Creator</Label>}
                                </List.Description>
                            </List.Content>
                            {data.currentUserId === data.creatorId
                                && <List.Content floated='right' onClick={() => removeUser(u._id)}>
                                    <Button icon='remove' basic size='tiny' />
                                </List.Content>
                            }
                        </List.Item>
                    )}
                </List>
            </div>
            : <Loader active />
        }

    </>
}

function AddUserModal({ onUser, onClose }) {
    const [text, setText] = useState('');
    const [users, setUsers] = useState();
    const onSubmit = e => {
        e.preventDefault();
        e.stopPropagation();
        axios.get('/api/search/user', { params: { text } })
            .then(res => {
                setUsers(res.data);
            });
    }
    return <Modal
        open={true}
        onClose={onClose}
        closeIcon
        size='small'
    >
        <Modal.Header>Add user</Modal.Header>
        <Modal.Content>
            <Form onSubmit={onSubmit}>
                <div style={{ display: 'flex', width: '100%' }}>
                    <Input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        type='search'
                        placeholder='Search by name, username, email'
                        style={{ flexGrow: 1 }}
                    />
                    <Button basic icon='search' />
                </div>
            </Form>
            {users &&
                <List selection>
                    {users.map(u =>
                        <List.Item onClick={() => onUser(u._id)} key={u._id}>
                            <Image src={u.avatar || '/default-avatar.svg'} avatar />
                            <List.Content>
                                <List.Header>{`${u.firstName} ${u.lastName}`}</List.Header>
                                {u.username && <List.Description>{`@${u.username}`}</List.Description>}
                                {u.email && <List.Description>{u.email}</List.Description>}
                            </List.Content>
                        </List.Item>
                    )}
                </List>
            }
        </Modal.Content>
    </Modal>
}