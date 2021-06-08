import axios from "axios";
import { useEffect, useState } from "react";
import {
    Button, Form, Header,
    Icon, Label, Search, Segment
} from "semantic-ui-react";

export default function CreateConversation({ onCreated }) {
    const [users, setUsers] = useState([]);
    const onSubmit = e => {
        e.preventDefault();
        const title = e.target.title.value;
        const userIds = users.map(u => u._id);
        axios
            .post('/api/chat/', { userIds, title })
            .then(res => {
                const conversationId = res.data;
                onCreated(conversationId);
            });
    }
    return <Form onSubmit={onSubmit} size='large' style={{ maxWidth: '700px', margin: 'auto', padding: '1em' }}>
        <Header>New Conversation</Header>
        <Form.Input name='title' id='title' label='Title' placeholder='Title' />
        {users.length > 0
            && <Form.Field>
                <label>Users</label>
                <Segment style={{ margin: 0 }}>
                    {users.map(u =>
                        <Label image size='large' key={u._id}>
                            <img src={u.avatar || '/default-avatar.svg'} />
                            {`${u.firstName} ${u.lastName}`}
                            <Icon name='delete'
                                onClick={() => setUsers(users.filter(u1 => u1._id != u._id))}
                            />
                        </Label>
                    )}
                </Segment>
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
        resultRenderer={user =>
            <div key={user._id} style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
                <img src={user.avatar || '/default-avatar.svg'} style={{ width: '2em', height: '2em' }} />
                <div style={{ marginLeft: '0.5em' }}>
                    {`${user.firstName} ${user.lastName}`}
                </div>
            </div>
        }
        results={results}
        loading={loading}
    />
}