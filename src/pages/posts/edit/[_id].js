import axios from "axios";
import Head from 'next/head';
import { useRouter } from "next/router";
import { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Button, Form, Header } from "semantic-ui-react";
import FilePicker from '../../../components/FilePicker';

export default function EditPost() {
    const router = useRouter();
    const { _id } = router.query;
    const { data: post, isLoading } = useQuery(`/api/posts/details/${_id}`, () =>
        axios.get(`/api/posts/details/${_id}`).then(res => res.data)
    );
    if (isLoading) return null;
    return <div style={{ maxWidth: '700px', margin: 'auto', padding: '1em' }}>
        <Head>
            <title>Edit Post</title>
        </Head>
        <EditForm {...post} />
    </div>
}

function EditForm({ _id, text, files }) {
    const [newFiles, setNewFiles] = useState([]);
    const [deletedFiles, setDeletedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();
    const onDelete = fileId => () => {
        if (confirm('Are you sure you want to delete?')) {
            setDeletedFiles([...deletedFiles, fileId]);
        }
    }
    const onSubmit = e => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData();
        formData.append('text', form.text.value);
        formData.append('deletedFiles', JSON.stringify(deletedFiles));
        for (let file of newFiles) {
            formData.append('files', file);
        }
        setLoading(true);
        axios.put(`/api/posts/${_id}`, formData)
            .then(() => {
                setLoading(false);
                router.push(`/posts/details/${_id}`);
            })
            .catch(error => {
                setLoading(false);
                alert(error.response?.data.message || error.message);
            }).finally(() => {
                queryClient.invalidateQueries();
            });
    }
    return <Form onSubmit={onSubmit} style={{ maxWidth: '700px' }} loading={loading}>
        <Header>Edit Post</Header>
        <Form.TextArea defaultValue={text} required name='text' />
        <div>
            {files?.filter(f => !deletedFiles.includes(f._id))
                .map(f =>
                    <div key={f._id} style={{ position: 'relative' }}>
                        {f.resourceType === 'image'
                            ? <img src={f.url} style={{ width: '100%' }} />
                            : <video src={f.url} style={{ width: '100%' }} />
                        }
                        <Button onClick={onDelete(f._id)} icon='trash' circular
                            style={{ position: 'absolute', top: 0, right: 0, margin: '1em' }} />
                    </div>
                )}
        </div>
        <div>
            <FilePicker image video multiple value={newFiles} onChange={setNewFiles} />
        </div>
        <Button type='submit' primary>Save</Button>
    </Form>
}