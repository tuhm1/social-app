import React, { useState } from 'react';
import Head from 'next/head';
import { Container, Menu, Button, Image } from 'semantic-ui-react';
import Masonry from 'react-masonry-css';
import masonryCss from '../styles/masonry.module.css';
import Link from 'next/link';
import PostCreateModal from '../components/posts/PostCreateModal';
import AuthModal from '../components/AuthModal';
import css from '../styles/Home.module.css';
import { useRouter } from 'next/router';
import axios from 'axios';
import Carousel from '../components/Carousel';
export async function getServerSideProps({ req }) {
  const { Post } = req.app.get('dbContext');
  const posts = await Post.aggregate([
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'users' } },
    { $lookup: { from: 'likes', localField: '_id', foreignField: 'postId', as: 'likes' } },
    { $set: { user: { $arrayElemAt: ['$users', 0] } } },
    {
      $project: {
        _id: 1, text: 1, files: 1, 'user._id': 1,
        'user.firstName': 1, 'user.lastName': 1, 'likes.userId': 1
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

const breakpointCols = { default: 3, 800: 1 };

export default function Home({ currentUserId, posts }) {
  return (
    <div>
      <Head>
        <title>{`{{App name}}`}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Menu inverted style={{ position: 'sticky', top: 0, zIndex: 2 }}>
        {!currentUserId
          && <AuthModal trigger={<Menu.Item as={Button} icon='user' position='right' />} />
        }
        {currentUserId
          && <PostCreateModal trigger={<Menu.Item as={Button} icon='plus' position='right' />} />
        }
      </Menu>
      <Container>
        <Masonry breakpointCols={breakpointCols}
          className={masonryCss['masonry-grid']}
          columnClassName={masonryCss['masonry-grid_column']}
        >
          {posts.map(({ _id, text, files, user, likes }) =>
            <div key={_id} className={'ui segment ' + css.post}>
              <Link href={`/posts/${_id}`}>
                <a className={css.stretchedLink} />
              </Link>
              <div>
                <Image src={user.avatar || '/default-avatar.svg'} avatar className={css.avatar} />
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
                <Button icon='comment' />
              </div>
            </div>
          )}
        </Masonry>
      </Container>
    </div >
  )
}

function LikeButton({ postId, likes, currentUserId }) {
  const router = useRouter();
  const [response, setResponse] = useState({ status: 'idle' });
  const liked = likes.some(l => l.userId === currentUserId);
  if (liked) {
    const onClick = () => {
      setResponse({ status: 'loading' });
      axios.delete(`/api/likes/${postId}`)
        .then(() => {
          setResponse({ status: 'success' });
          router.replace(router.asPath, undefined, { scroll: false });
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
        router.replace(router.asPath, undefined, { scroll: false });
      }).catch(error => {
        setResponse({ status: 'error', error });
      });
  };
  return <Button
    onClick={onClick}
    content={likes.length}
    icon='like'
    loading={response.status === 'loading'}
  />
}