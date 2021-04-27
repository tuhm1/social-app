import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { Button, Divider, Form, Header, Message } from 'semantic-ui-react';
import GoogleLogin from './GoogleLogin';
const LogInForm = ({ onDone }) => {
    const [response, setResponse] = useState({ state: 'idle' });
    const router = useRouter();
    const onSubmit = e => {
        e.preventDefault();
        setResponse({ state: 'loading' });
        const username = e.target.username.value,
            password = e.target.password.value;
        e.target.reset();
        axios.post('/api/auth/login', { username, password })
            .then(() => {
                router.replace(router.asPath, undefined, { scroll: false });
                setResponse({ state: 'success' });
                onDone();
            })
            .catch(error => {
                setResponse({ state: 'error', error });
            })
    };
    return <Form onSubmit={onSubmit} loading={response.state === 'loading'} size='large'>
        <Header as='h2' textAlign='center'>Log In</Header>
        {response.state === 'error' &&
            <Message negative>
                <Message.Header>Error</Message.Header>
                <p>Invalid username or password.</p>
            </Message>
        }
        <Form.Input name='username' label='Username' placeholder='Username' />
        <Form.Input name='password' label='Password' type='password' placeholder='Password' />
        <Button type='submit' size='large' fluid>Log In</Button>
        <Divider />
        <GoogleLogin onDone={onDone} />
    </Form>
};

export default LogInForm;