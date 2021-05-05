import React from 'react';
import Head from 'next/head';
import { Container, Menu, Button, Image, Divider, Card, Header, Segment } from 'semantic-ui-react';
import Masonry from 'react-masonry-css';
import masonryCss from '../../styles/masonry.module.css';
import Link from 'next/link';
import PostCreateModal from './_components/posts/PostCreateModal';
import AuthModal from './_components/AuthModal';
import GalleryWidget from './_components/GalleryWidget';
import css from '../../styles/Home.module.css';

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
          {posts.map(({ _id, text, files, user }) =>
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
              {files?.length > 0 && <GalleryWidget files={files} />}
              <Button icon='like' className={css.button} />
              <Button icon='comment' className={css.button} />
            </div>
          )}
        </Masonry>
      </Container>
    </div >
  )
}

export async function getServerSideProps({ req }) {
  const { Post } = req.app.get('dbContext');
  const posts = await Post.aggregate([
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    { $set: { user: { $arrayElemAt: ['$user', 0] } } }
  ]);
  return {
    props: {
      currentUserId: req.user ?? null,
      posts: JSON.parse(JSON.stringify(posts))
    }
  };
}