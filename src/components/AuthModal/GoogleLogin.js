import axios from 'axios';
import { useState } from 'react';
import GoogleLoginCore from 'react-google-login';
import { Button, Icon, Message } from 'semantic-ui-react';
import { useRouter } from 'next/router';

const GoogleLogin = ({ onDone }) => {
    const [response, setResponse] = useState({ state: 'idle' });
    const router = useRouter();
    const onGoogleLoggedIn = response => {
        setResponse({ state: 'loading' });
        axios.post('/api/auth/google', { idToken: response.tokenId })
            .then(() => {
                router.replace(router.asPath, undefined, { scroll: false });
                setResponse({ state: 'success' });
                onDone();
            })
            .catch(error => {
                setResponse({ state: 'error', error })
            });
    }
    return <>
        {response.state === 'error' &&
            <Message>
                <Message.Header>Error</Message.Header>
                <p>{response.error.response?.data?.message || response.error.message}</p>
            </Message>
        }
        <GoogleLoginCore
            clientId={process.env.GOOGLE_CLIENT_ID}
            onSuccess={onGoogleLoggedIn} cookiePolicy={'single_host_origin'}
            render={({ onClick, disabled }) =>
                <Button
                    onClick={onClick} disabled={disabled}
                    loading={response.state === 'loading'} fluid size='large'
                    color='red'
                    icon='google'
                    content='Log In with Google'
                />
            }
        />
    </>
};

export default GoogleLogin;