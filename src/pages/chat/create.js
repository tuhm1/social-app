import axios from "axios";
import { useRouter } from 'next/router';
import { useEffect, useState } from "react";
import {
    Button, Form, Header,
    Icon, Label, Search
} from "semantic-ui-react";

export default function CreateConversation() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const onSubmit = e => {
        e.preventDefault();
        const title = e.target.title.value;
        const userIds = users.map(u => u._id);
        axios
            .post('/api/chat/', { userIds, title })
            .then(res => {
                const conversationId = res.data;
                router.push(`/chat/conversations/${conversationId}`);
            });
    }
    return <Form onSubmit={onSubmit} size='large' style={{ maxWidth: '700px', margin: 'auto', padding: '1em' }}>
        <Header>New Conversation</Header>
        <Form.Input name='title' id='title' label='Title' placeholder='Title' />
        {users.length > 0
            && <Form.Field>
                <label>Users</label>
                <div>
                    {users.map(u =>
                        <Label image size='large' key={u._id}>
                            <img src={u.avatar || '/default-avatar.svg'} />
                            {`${u.firstName} ${u.lastName}`}
                            <Icon name='delete'
                                onClick={() => setUsers(users.filter(u1 => u1._id != u._id))}
                            />
                        </Label>
                    )}
                </div>
            </Form.Field>
        }
        <Form.Field>
            <label>Add user</label>
            <AddUser onSelect={user => setUsers([...users, user])} />
        </Form.Field>
        <Button type='submit' primary>Create</Button>
    </Form>
}

function AddUser({ onSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (query.length > 0) {
            setLoading(true);
            axios.get(`/api/user`, { params: { q: query } })
                .then(res => {
                    setResults(res.data);
                    setLoading(false);
                });
        }
    }, [query]);
    return <Search
        value={query}
        onSearchChange={(e, data) => setQuery(data.value)}
        onResultSelect={(e, data) => {
            onSelect(data.result);
            setQuery('');
        }}
        resultRenderer={SearchRenderer}
        results={results}
        loading={loading}
    />
}

function SearchRenderer({ _id, firstName, lastName, avatar, email, username }) {
    return <div key={_id} style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
        <img src={avatar || '/default-avatar.svg'} style={{ width: '3em', height: '3em' }} />
        <div style={{ marginLeft: '0.5em' }}>
            <a style={{ fontWeight: 'bold' }}>{`${firstName} ${lastName}`}</a>
            <p>{email || `@${username}`}</p>
        </div>
    </div>
}