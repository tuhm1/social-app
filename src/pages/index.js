import React from 'react';
import Head from 'next/head';
import { Container, Menu, Button, Image, Divider, Card, Header, Segment } from 'semantic-ui-react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Masonry from 'react-masonry-css';
import styles from '../../styles/masonry.module.css';

import PostCreateModal from './_components/post/PostCreateModal';
import LoginModal from './_components/auth/LogInModal';

export default function Home({ currentUserId, posts }) {
  return (
    <div>
      <Head>
        <title>{`{{App name}}`}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Menu inverted style={{ position: 'sticky', top: 0, zIndex: 2 }}>
        {!currentUserId
          && <LoginModal trigger={<Menu.Item as={Button} icon='user' position='right' />} />
        }
        {currentUserId
          && <PostCreateModal trigger={<Menu.Item as={Button} icon='plus' position='right' />} />
        }
      </Menu>
      {/*<Container style={{ maxWidth: '700px!important' }}>
        {posts.map(p => {
          const user = p.user[0];
          return <React.Fragment key={p._id}>
            <div>
              <Image
                avatar
                src={user.avatar || '/default-avatar.svg'}
                size='tiny'
              />
              <a style={{ fontSize: 'x-large' }}>{`${user.firstName} ${user.lastName}`}</a>
              <p style={{ fontSize: 'medium' }}>{p.text}</p>
              <Slider dots autoplay arrows={false} accessibility adaptiveHeight>
                {p.files?.map(f =>
                  f.resourceType === 'image'
                    ? <img src={f.url} key={f.url} />
                    : <video src={f.url} controls autoPlay key={f.url} />
                )}
              </Slider>
            </div>
            <Divider />
          </React.Fragment>
        })}
      </Container>*/}
      <Container>
        <Masonry breakpointCols={{ default: 3, 1000: 2, 600: 1 }}
          className={styles['masonry-grid']}
          columnClassName={styles['masonry-grid_column']}
        >
          {posts.map(({ _id, text, files, user }) =>
            <Segment key={_id} raised>
              <div>
                <Image src={user.avatar || '/default-avatar.svg'} avatar />
                <a style={{ fontSize: 'large' }}>
                  {`${user.firstName} ${user.lastName}`}
                </a>
              </div>
              <p style={{ fontSize: 'large' }}>
                {text.slice(0, 200)}
                {text.length > 200
                  && <>... <a>More</a></>
                }
              </p>
              <Slider dots autoplay arrows={false}>
                {files?.map(f =>
                  f.resourceType === 'image'
                    ? <img src={f.url} key={f.url} />
                    : <video src={f.url} controls autoPlay key={f.url} />
                )}
              </Slider>
              <Button icon='like' />
              <Button icon='comment' />
            </Segment>
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
};