import axios from "axios";
import { useEffect, useState } from "react";
import {
    Button,
    Form,
    Image,
    Message,
    Modal,
    Segment
} from "semantic-ui-react";
import { useRouter } from 'next/router';
import InputFile from '../FilePicker';

export default function EditModal({ user, trigger }) {
    const [isOpen, setIsOpen] = useState(false);
    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    return <Modal
        trigger={trigger}
        open={isOpen}
        onOpen={open}
        onClose={close}
        closeIcon
        size='small'
    >
        <Modal.Header>Edit Profile</Modal.Header>
        <Modal.Content>
            <EditForm
                user={user}
                onDone={close} />
        </Modal.Content>
    </Modal>;
}

function EditForm({ user, onDone }) {
    const [response, setResponse] = useState({ state: 'idle' });
    const [avatarInput, setAvatarInput] = useState({ action: null });
    const router = useRouter();
    const onSubmit = e => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData();
        formData.append('first_name', form.firstname.value);
        formData.append('last_name', form.lastname.value);
        if (form.bio.value)
            formData.append('bio', form.bio.value);
        if (avatarInput.action) {
            formData.append('avatar_action', avatarInput.action);
            if (avatarInput.action === 'change') {
                formData.append('new_avatar', avatarInput.newAvatar);
            }
        }
        setResponse({ state: 'loading' });
        axios.put('/api/user', formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        ).then(() => {
            setResponse({ state: 'success' });
            router.replace(router.asPath, undefined, { scroll: false });
            onDone();
        }).catch(error => {
            setResponse({ state: 'error', error });
        });
    };
    return <Form
        onSubmit={onSubmit}
        loading={response.state === 'loading'}
    >
        <AvatarInput
            old={user.avatar}
            onChange={setAvatarInput}
            value={avatarInput} />
        <Form.Input
            name='firstname'
            label='First name'
            required
            value={user.firstName}
        />
        <Form.Input
            name='lastname'
            label='Last name'
            required 
            value={user.lastName}
        />
        <Form.TextArea
            name='bio'
            label='Introduction'
            value={user.bio}
        />
        <Button
            type='submit'
            fluid
            primary
            icon='save'
            content='Save'
        />
        {response.state === 'error'
            && <Message
                error
                header='Error'
                content={error.message}
            />
        }
    </Form>;
}

function AvatarInput({ old, onChange, value }) {
    return <Form.Field>
        <label htmlFor='avatar-action'>Avatar</label>
        {old
            && <Button
                onClick={() => onChange({ action: 'delete' })}
                icon='delete'
                type='button' />}
        <Button
            onClick={() => onChange({ action: 'change' })}
            icon='edit'
            type='button' />
        {value.action === 'change'
            && <Segment>
                <InputFile
                    image
                    value={value.newAvatar ? [value.newAvatar] : []}
                    onChange={files => {
                        onChange({
                            action: 'change',
                            newAvatar: files[0]
                        });
                    }}
                />
            </Segment>
        }
        <AvatarPreview old={old} value={value} />
    </Form.Field>;
}

function AvatarPreview({ old, value: { action, newAvatar } }) {
    const [newAvatarURL, setNewAvatarURL] = useState();
    useEffect(() => {
        if (newAvatar) {
            const blob = URL.createObjectURL(newAvatar);
            setNewAvatarURL(blob);
            return () => URL.revokeObjectURL(newAvatarURL);
        }
    }, [newAvatar]);
    const defaultURL = '/default-avatar.svg';
    console.log(newAvatar);
    return <Image
        src={
            action === 'delete'
                ? defaultURL
                : action === 'change'
                    ? (newAvatarURL || defaultURL)
                    : (old || defaultURL)
        }
        size='small'
    />
}