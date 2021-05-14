import React, { useState, useEffect } from 'react';
import { Container, Button, Image } from 'semantic-ui-react';
import Masonry from 'react-masonry-css';
import masonryCss from '../styles/masonry.module.css';
import Link from 'next/link';
import css from '../styles/Home.module.css';
import { useRouter } from 'next/router';
import axios from 'axios';
import Carousel from '../components/Carousel';
import io from 'socket.io-client';

export async function getServerSideProps({ req }) {
  const { Post } = req.app.get('dbContext');
  const posts = await Post.aggregate([
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'users' } },
    { $lookup: { from: 'likes', localField: '_id', foreignField: 'postId', as: 'likes' } },
    { $lookup: { from: 'comments', localField: '_id', foreignField: 'postId', as: 'comments' } },
    { $set: { user: { $arrayElemAt: ['$users', 0] } } },
    {
      $project: {
        _id: 1, text: 1, files: 1, 'user._id': 1, 'user.avatar': 1,
        'user.firstName': 1, 'user.lastName': 1, 'likes.userId': 1,
        commentsCount: { $size: '$comments' }
      }
    }
  ]);
  return {
    props: {
      currentUserId: req.user ?? null,
      posts: JSON.parse(JSON.stringify(posts))
    }
  };
}

const breakpointCols = { default: 2, 800: 1 };

export default function Home({ currentUserId, posts }) {
  const router = useRouter();
  useEffect(() => {
    const socket = io();
    socket.onAny(() => {
      router.replace(router.asPath, undefined, { scroll: false });
    });
    return () => socket.close();
  }, []);
  return <Container>
    <Masonry breakpointCols={breakpointCols}
      className={masonryCss['masonry-grid']}
      columnClassName={masonryCss['masonry-grid_column']}
    >
      {posts.map(({ _id, text, files, user, likes, commentsCount }) =>
        <div key={_id} className={'ui segment ' + css.post}>
          <Link href={`/posts/${_id}`}>
            <a className={css.stretchedLink} />
          </Link>
          <div className={css.header}>
            <img src={user.avatar || '/default-avatar.svg'} className={css.avatar} />
            <Link href={`/users/${user._id}`}>
              <a className={css.username}>
                {`${user.firstName} ${user.lastName}`}
              </a>
            </Link>
          </div>
          <p className={css.text}>
            {text.slice(0, 200)}
            {text.length > 200
              && <>...
                      <Link href={`/posts/${_id}`}>
                  <a>More</a>
                </Link>
              </>
            }
          </p>
          {files?.length > 0 && <Carousel files={files} className={css.carousel} />}
          <div className={css.buttons}>
            <LikeButton postId={_id} likes={likes} currentUserId={currentUserId} />
            <Link href={`/posts/${_id}`}>
              <Button icon='comment' content={commentsCount} basic />
            </Link>
          </div>
        </div>
      )}
    </Masonry>
  </Container>
}

function LikeButton({ postId, likes, currentUserId }) {
  const [response, setResponse] = useState({ status: 'idle' });
  const liked = likes.some(l => l.userId === currentUserId);
  if (liked) {
    const onClick = () => {
      setResponse({ status: 'loading' });
      axios.delete(`/api/likes/${postId}`)
        .then(() => {
          setResponse({ status: 'success' });
        }).catch(error => {
          setResponse({ status: 'error', error });
        });
    };
    return <Button
      onClick={onClick}
      content={likes.length}
      primary
      icon='like'
      className={css.button}
    />
  }
  const onClick = () => {
    setResponse({ status: 'loading' });
    axios.post(`/api/likes/${postId}`)
      .then(() => {
        setResponse({ status: 'success' });
      }).catch(error => {
        setResponse({ status: 'error', error });
      });
  };
  return <Button
    onClick={onClick}
    content={likes.length}
    icon='like'
    basic
    loading={response.status === 'loading'}
  />
}