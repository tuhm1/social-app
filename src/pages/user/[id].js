import {
    Button, Container, Divider,
    Header, Image, Menu,
    Segment, Statistic, Icon
} from "semantic-ui-react";
import LoginModal from '../../components/auth/LogInModal';

export default function Me({ user, currentUserId }) {
    console.log(currentUserId);
    return <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Menu inverted style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            {!currentUserId && <LoginModal trigger={<Menu.Item as={Button} icon='user' />} />}
        </Menu>
        <Container style={{ flexGrow: 1 }}>
            <Segment style={{
                maxWidth: '700px', margin: 'auto', display: 'flex',
                flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
            }}>
                {user
                    ? <>
                        <Image circular size='medium' src={user.avatar || 'https://www.watsonmartin.com/wp-content/uploads/2016/03/default-profile-picture.jpg'} />
                        <Header as='h1' icon>
                            {`${user.firstName} ${user.lastName}`}
                            <Header.Subheader style={{ fontSize: 'large' }}>
                                {user.bio || 'Hello World!!!'}
                            </Header.Subheader>
                        </Header>
                        <div>
                            <Statistic value='123' label='followers' />
                            <Statistic value='456' label='posts' />
                        </div>
                        {currentUserId !== user._id
                            ? <div>
                                <Button size='large'>Follow</Button>
                                <Button size='large'>Message</Button>
                            </div>
                            : <Button size='large'>
                                <Icon name='edit' />
                                Edit
                            </Button>
                        }
                    </>
                    : <Header as='h1' icon>
                        <Icon name='search' />
                        User not found
                    </Header>
                }

            </Segment>
            <Divider />
        </Container>
    </div>
};

export async function getServerSideProps({ req, params }) {
    const id = params.id;
    const { User } = req.app.get('dbContext');
    let user = await User.findById(id).lean();
    if (!user) {
        return { props: { user: null } };
    }
    user = { ...user, _id: user._id.toString() };
    const currentUserId = req.user ?? null;
    return { props: { user, currentUserId } };
};