import axios from "axios";
import * as faceapi from 'face-api.js';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { Button, Dimmer, Form, Icon, Image, Input, Label, List, Loader, Menu, Modal } from "semantic-ui-react";
import InputFile from "../../components/FilePicker";
import css from '../../styles/PostCreate.module.css';

export default function PostCreateForm() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [files, setFiles] = useState([]);
    const [faceApiLoaded, setFaceApiLoaded] = useState(false);
    const [facesInImages, setFacesInImages] = useState();
    const [usersInImages, setUsersInImages] = useState();
    const [response, setResponse] = useState({ status: 'idle' });
    useEffect(() => {
        Promise.all([
            faceapi.loadSsdMobilenetv1Model('/face-api/models'),
            faceapi.loadFaceLandmarkModel('/face-api/models'),
            faceapi.loadFaceRecognitionModel('/face-api/models')
        ]).then(() => setFaceApiLoaded(true));
    }, []);
    const onFilesChange = newFiles => {
        setFiles(newFiles);
        setFacesInImages(newFiles.map(newFile => {
            const i = files.indexOf(newFile);
            return i !== -1 ? facesInImages[i] : null;
        }));
        setUsersInImages(newFiles.map(newFile => {
            const i = files.indexOf(newFile);
            return i !== -1 ? usersInImages[i] : null;
        }));
    }
    const onSubmit = e => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData();
        formData.append('text', form.text.value);
        for (let file of files) {
            formData.append('files', file);
        }
        const facesPayload = files.map((file, i) =>
            file.type.includes('image')
                ? facesInImages[i].map((face, j) => {
                    const box = face.detection.relativeBox;
                    return {
                        x: box.x,
                        y: box.y,
                        width: box.width,
                        height: box.height,
                        userId: usersInImages[i][j]?._id,
                        descriptor: Array.from(face.descriptor)
                    }
                })
                : null
        );
        formData.append('faces', JSON.stringify(facesPayload));
        setResponse({ status: 'loading' });
        axios.post('/api/posts', formData)
            .then(res => {
                form.reset();
                setFiles([]);
                setResponse({ status: 'success' });
                router.push(`/posts/details/${res.data._id}`);
            }).catch(error => {
                setResponse({ status: 'error', error });
                alert(error.response?.data.message || error.message);
            }).finally(() => {
                queryClient.invalidateQueries();
            });

    }
    return <div className={css.page}>
        <Head>
            <title>New Post</title>
        </Head>
        <Menu secondary pointing>
            <Menu.Item header>New Post</Menu.Item>
        </Menu>
        <Form
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
                onChange={onFilesChange}
                multiple
                image
                video
            />
            <div>
                {files.map((file, i) =>
                    file.type.includes('image')
                        ? <ImageSelected
                            file={file}
                            faceApi={faceApiLoaded}
                            faces={facesInImages[i]}
                            onFaces={faces => {
                                setFacesInImages(facesInImages =>
                                    facesInImages.map((f, j) => i === j ? faces : f)
                                );
                            }}
                            users={usersInImages[i]}
                            onUsers={users => {
                                setUsersInImages(usersInImages =>
                                    usersInImages.map((u, j) => i === j ? users : u)
                                )
                            }}
                        />
                        : <VideoSelected file={file} />
                )}
            </div>
            <Button
                type='submit'
                primary
                content='Post'
            />
        </Form>
    </div>
}

function VideoSelected({ file }) {
    const [previewUrl, setPreviewUrl] = useState();
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);
    if (!previewUrl) return null;
    return <video src={previewUrl} className={css.preview} controls />
}

function ImageSelected({ file, faceApi, faces, onFaces, users, onUsers }) {
    const [previewUrl, setPreviewUrl] = useState();
    const [detecting, setDetecting] = useState(false);
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);
    useEffect(() => {
        if (!faceApi || faces) return;
        setDetecting(true);
        faceapi.bufferToImage(file)
            .then(img =>
                faceapi
                    .detectAllFaces(img)
                    .withFaceLandmarks()
                    .withFaceDescriptors()
            )
            .then(async detectedFaces => {
                onFaces(detectedFaces);
                const users = detectedFaces.map(() => null);
                onUsers(users);
                setDetecting(false);
                const savedFaces = await axios.get('/api/faces').then(res => res.data);
                savedFaces.forEach(face => {
                    face.descriptorF32Arrs = face.descriptors.map(d => new Float32Array(d));
                });
                const labeledDescriptors = savedFaces.map(face =>
                    new faceapi.LabeledFaceDescriptors(face.user._id, face.descriptorF32Arrs)
                );
                const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);
                detectedFaces.forEach((detectedFace, i) => {
                    const match = faceMatcher.findBestMatch(detectedFace.descriptor);
                    if (match.label !== 'unknown') {
                        const matchFace = savedFaces.find(faceDb => faceDb.user._id === match.label);
                        const newUsersState = users.map((_user, j) => i === j ? matchFace.user : _user);
                        onUsers(newUsersState);
                    }
                });
            });
    }, [file, faces, faceApi]);
    return <div className={css.file}>
        {detecting && <Dimmer active>
            <Loader>Detecting faces</Loader>
        </Dimmer>
        }
        {previewUrl && <img src={previewUrl} className={css.preview} />}
        {faces && faces.map((face, i) => {
            const box = face.detection.relativeBox;
            return <div
                className={css.faceDetected}
                style={{
                    left: box.x * 100 + '%',
                    top: box.y * 100 + '%',
                    width: box.width * 100 + '%',
                    height: box.height * 100 + '%',
                }}
            >
                {users && (!users[i]
                    ? <ButtonTag onUser={user => onUsers(users.map((_user, j) => i === j ? user : _user))} />
                    : <Label basic style={{ whiteSpace: 'nowrap' }}>
                        {`${users[i].firstName} ${users[i].lastName}`}
                        <Icon name='delete' onClick={() => onUsers(users.map((u, j) => i !== j && u))} />
                    </Label>)
                }
            </div>
        })
        }
    </div>
}

function ButtonTag({ onUser }) {
    const [open, setOpen] = useState(false);
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
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        closeIcon
        trigger={<Button type='button' circular icon='user plus' size='mini' color='teal' />}
        size='small'
    >
        <Modal.Header>Tag user</Modal.Header>
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
                        <List.Item onClick={() => {
                            setOpen(false);
                            onUser(u);
                        }} key={u._id}>
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