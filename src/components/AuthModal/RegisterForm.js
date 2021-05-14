import React, { useState } from 'react';
import { Button, Form, Header, Message, Divider } from 'semantic-ui-react';
import axios from 'axios';
import GoogleLogin from './GoogleLogin';
const RegisterForm = ({ onDone }) => {
    const [response, setResponse] = useState({ state: 'idle' });
    const onSubmit = e => {
        e.preventDefault();
        const firstName = e.target.firstname.value,
            lastName = e.target.lastname.value,
            username = e.target.username.value,
            password = e.target.password.value;
        e.target.reset();
        setResponse({ state: 'loading' });
        axios.post('/api/auth/register', { firstName, lastName, username, password })
            .then(() => {
                setResponse({ state: 'success' });
                onDone();
            })
            .catch(error => {
                setResponse({ state: 'error', error });
            });
    };
    return <Form onSubmit={onSubmit} loading={response.state === 'loading'} size='large'>
        <Header as='h2' textAlign='center'>
            Register
        </Header>
        {response.state === 'error' &&
            <Message negative>
                <Message.Header>Error</Message.Header>
                <p>{response.error.message}</p>
            </Message>
        }
        <Form.Input name='firstname' label='First name' required />
        <Form.Input name='lastname' label='Last name' required />
        <Form.Input name='username' label='Username' required />
        <Form.Input name='password' label='Password' type='password' required />
        <Button type='submit' size='large' fluid primary>Register</Button>
        <Divider />
        <GoogleLogin onDone={onDone} />
    </Form>
};

export default RegisterForm;