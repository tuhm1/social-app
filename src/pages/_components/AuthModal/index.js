import React from 'react';
import { Modal, Tab } from 'semantic-ui-react';
import LogInForm from './LogInForm';
import RegisterForm from './RegisterForm';

const LogInModal = ({ trigger }) => {
    const [isOpen, setOpen] = React.useState(false);
    const close = () => setOpen(false);
    const open = () => setOpen(true);
    return <Modal
        open={isOpen} trigger={trigger} onOpen={open}
        onClose={close} closeIcon size='tiny'
    >
        <Tab panes={[
            {
                menuItem: 'Log In',
                render: () => <Tab.Pane>
                    <LogInForm onDone={close} />
                </Tab.Pane>
            },
            {
                menuItem: 'Register',
                render: () => <Tab.Pane>
                    <RegisterForm onDone={close} />
                </Tab.Pane>
            },
        ]} />
    </Modal>
};
export default LogInModal;