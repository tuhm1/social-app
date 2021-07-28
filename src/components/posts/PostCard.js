import { useQueryClient } from 'react-query';
import Link from 'next/link';
import css from '../../styles/PostCard.module.css';
import { Button, Label } from 'semantic-ui-react';
import { useState, useCallback } from 'react';
import axios from 'axios';

export default function PostCard({ _id, text, files, user, likesCount, liked, commentsCount, createdAt }) {
    return <div className={'ui segment ' + css.post}>
        <Link href={`/posts/details/${_id}`}>
            <a className={css.stretchedLink} />
        </Link>
        <div className={css.header}>
            <img src={user.avatar || '/default-avatar.svg'} className={css.avatar} />
            <div className={css.headerTitle}>
                <Link href={`/users/${user._id}`}>
                    <a className={css.username}>
                        {`${user.firstName} ${user.lastName}`}
                    </a>
                </Link>
                <div className={css.time}>
                    {new Date(createdAt).toLocaleString()}
                </div>
            </div>
        </div>
        <p className={css.text}>
            {text.slice(0, 200)}
            {text.length > 200
                && <>...
                    <Link href={`/posts/details/${_id}`}>
                        <a>More</a>
                    </Link>
                </>
            }
        </p>
        {files?.length > 0
            && <div className={css.medias}>
                {files.map(file =>
                    <div className={css.slide}>
                        {file.resourceType === 'image'
                            ? <ImageWithTags {...file} key={file.url} />
                            : <video src={file.url} className={css.media} key={file.url}
                                controls autoPlay muted loop
                            />
                        }
                    </div>
                )}
            </div>
        }
        <div className={css.buttons}>
            <LikeButton postId={_id} likesCount={likesCount} liked={liked} />
            <Link href={`/posts/details/${_id}`}>
                <Button icon='comment' content={commentsCount} basic />
            </Link>
        </div>
    </div >
}


function ImageWithTags({ url, faces }) {
    const [imageSize, setImageSize] = useState();
    const getImageSize = useCallback(img => {
        if (!img) return;
        img.onload = () => {
            setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        }
    }, [url]);
    const containerStyle = imageSize
        ? imageSize.width > imageSize.height
            ? { width: '100%', height: 'auto' }
            : { height: '100%', width: 'auto' }
        : {};
    return <div className={css.overlayContainer} style={containerStyle}>
        <img src={url} className={css.media} ref={getImageSize} />
        {faces?.map(face =>
            face.user && <div className={css.face} style={{
                left: face.x * 100 + '%',
                top: face.y * 100 + '%',
                width: face.width * 100 + '%',
                height: face.height * 100 + '%'
            }}>
                <Link href={`/users/${face.user._id}`}>
                    <Label as='a' className={css.faceLabel} color='teal'>
                        {`${face.user.firstName} ${face.user.lastName}`}
                    </Label>
                </Link>
            </div>
        )}
    </div>
}

function LikeButton({ postId, likesCount, liked }) {
    const queryClient = useQueryClient();
    const [response, setResponse] = useState({ status: 'idle' });
    if (liked) {
        const onClick = () => {
            setResponse({ status: 'loading' });
            axios.delete(`/api/likes/${postId}`)
                .then(() => {
                    setResponse({ status: 'success' });
                    queryClient.invalidateQueries();
                }).catch(error => {
                    alert(error.response?.data.message || error.message);
                    setResponse({ status: 'idle' });
                });
        };
        return <Button
            onClick={onClick}
            content={likesCount}
            primary
            icon='like'
            loading={response.status === 'loading'}
        />
    }
    const onClick = () => {
        setResponse({ status: 'loading' });
        axios.post(`/api/likes/${postId}`)
            .then(() => {
                setResponse({ status: 'success' });
                queryClient.invalidateQueries();
            }).catch(error => {
                alert(error.response?.data.message || error.message);
                setResponse({ status: 'idle' });
            });
    };
    return <Button
        onClick={onClick}
        content={likesCount}
        icon='like'
        basic
        loading={response.status === 'loading'}
    />
}