import axios from "axios";
import { useState } from "react";
import { Button, Form, Modal } from "semantic-ui-react";
import InputFile from "../../components/FilePicker";
import { useRouter } from 'next/router';
import { useQueryClient } from "react-query";

export default function PostCreateModal({ trigger }) {
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
        <Modal.Header>New Post</Modal.Header>
        <Modal.Content>
            <PostCreateForm onDone={close} />
        </Modal.Content>
    </Modal>;
}

function PostCreateForm({ onDone }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [files, setFiles] = useState([]);
    const [response, setResponse] = useState({ status: 'idle' });
    const onSubmit = e => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData();
        formData.append('text', form.text.value);
        for (let file of files) {
            formData.append('files', file);
        }
        setResponse({ status: 'loading' });
        axios.post('/api/posts', formData)
            .then(res => {
                form.reset();
                setFiles([]);
                setResponse({ status: 'success' });
                onDone();
                router.push(`/posts/details/${res.data._id}`);
            }).catch(error => {
                setResponse({ status: 'error', error });
                alert(error.response?.data.message || error.message);
            }).finally(() => {
                queryClient.invalidateQueries();
            });
    }
    return <Form
        onSubmit={onSubmit}
        success={response.status === 'success'}
        loading={response.status === 'loading'}
        error={response.status === 'error'}
    >
        <Form.TextArea
            name='text'
            placeholder='Share something to people...'
            required
        />
        <InputFile
            value={files}
            onChange={setFiles}
            multiple
            image
            video
        />
        <Button
            type='submit'
            primary
            content='Post'
        />
    </Form>
}