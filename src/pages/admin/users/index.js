import axios from "axios";
import Error from 'next/error';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Dropdown, Form, Icon, Loader, Menu, Pagination, Table } from "semantic-ui-react";
import css from '../../../styles/admin/users/index.module.css';

export default function Admin() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [search, setSearch] = useState('');
    const [admin, setAdmin] = useState();
    const [active, setActive] = useState();
    const { data, error, isFetching } = useQuery(['/api/admin/users', page, limit, search, admin, active], () =>
        axios.get('/api/admin/users', { params: { page, limit, search, admin, active } })
            .then(res => res.data)
    )
    if (error) {
        return <Error
            statusCode={error.response?.status}
            title={error.response?.data.message || error.message}
        />
    }
    return <div className={css.page}>
        <Head>
            <title>Users</title>
        </Head>
        <PageMenu />
        <div className={css.content}>
            <Menu secondary>
                <Menu.Item header>Users</Menu.Item>
            </Menu>
            <Filter search={search}
                onSearch={search => {
                    setPage(1);
                    setSearch(search);
                }}
                admin={admin}
                onAdmin={admin => {
                    setPage(1);
                    setAdmin(admin);
                }}
                active={active}
                onActive={active => {
                    setPage(1);
                    setActive(active);
                }}
            />
            {isFetching && <Loader active inline='centered' />}
            {data
                && <>
                    <Data {...data} />
                    <Pagination1 page={page} setPage={setPage} limit={limit} setLimit={setLimit} count={data.count} />
                </>
            }

        </div>
    </div>
}

function PageMenu() {
    return <Menu vertical>
        <Link href='/admin'>
            <Menu.Item as='a'>Dashboard</Menu.Item>
        </Link>
        <Link href='/admin/users'>
            <Menu.Item as='a' active>Users</Menu.Item>
        </Link>
        <Link href='/admin/reported'>
            <Menu.Item as='a'>Reported Posts</Menu.Item>
        </Link>
    </Menu>
}

function Filter({ search, onSearch, admin, onAdmin, active, onActive }) {
    return <div>
        <Form onSubmit={e => {
            e.preventDefault();
            onSearch(e.target.search.value);
        }}>
            <Form.Input label='Search' type='search' name='search' icon='search' placeholder='Search by name, username, email' defaultValue={search} />
        </Form>
        <Form>
            <Form.Group>
                <Form.Select label='Admin'
                    options={[
                        { key: 'all', text: 'All', value: undefined },
                        { key: 'true', text: 'True', value: true },
                        { key: 'false', text: 'False', value: false }
                    ]}
                    onChange={(_, { value }) => onAdmin(value)}
                    value={admin}
                />
                <Form.Select label='Active'
                    options={[
                        { key: 'all', text: 'All', value: undefined },
                        { key: 'true', text: 'True', value: true },
                        { key: 'false', text: 'False', value: false }
                    ]}
                    onChange={(_, { value }) => onActive(value)}
                    value={active}
                />
            </Form.Group>
        </Form>
    </div>
}

function Data({ users, isRoot }) {
    const queryClient = useQueryClient();
    const lock = id => {
        if (confirm('Are you sure you want to lock this account?')) {
            axios.post(`/api/admin/users/lock/${id}`)
                .then(() => queryClient.invalidateQueries());
        }
    }
    const unlock = id => {
        if (confirm('Are you sure you want to unlock this account?')) {
            axios.post(`/api/admin/users/unlock/${id}`)
                .then(() => queryClient.invalidateQueries());
        }
    }
    const addAdmin = id => {
        if (confirm('Are you sure you want to add Admin role to this account?')) {
            axios.post(`/api/admin/users/admin/${id}`)
                .then(() => queryClient.invalidateQueries());
        }
    }
    return <Table>
        <Table.Header>
            <Table.Row>
                <Table.HeaderCell>Id</Table.HeaderCell>
                <Table.HeaderCell>Info</Table.HeaderCell>
                <Table.HeaderCell>Active</Table.HeaderCell>
                <Table.HeaderCell>Admin</Table.HeaderCell>
                <Table.HeaderCell>Action</Table.HeaderCell>
            </Table.Row>
        </Table.Header>
        <Table.Body>{
            users.map(u =>
                <Table.Row key={u._id}>
                    <Table.Cell>{u._id}</Table.Cell>
                    <Table.Cell>
                        <div>
                            <img src={u.avatar || '/default-avatar.svg'} style={{ width: '3em', height: '3em', objectFit: 'cover', borderRadius: '50%' }} />
                        </div>
                        <div>
                            Name: <a>{`${u.firstName} ${u.lastName}`}</a>
                        </div>
                        {u.username && <div>Username: <a>{u.username}</a></div>}
                        {u.email && <div>Email: <a>{u.email}</a></div>}
                    </Table.Cell>
                    <Table.Cell>{u.deleted ? <Icon name='x' color='red' /> : <Icon name='check' color='teal' />}</Table.Cell>
                    <Table.Cell>{u.isAdmin ? <Icon name='check' color='teal' /> : <Icon name='x' color='red' />}</Table.Cell>
                    <Table.Cell>
                        <Dropdown icon='ellipsis vertical' className='pointing top right'>
                            <Dropdown.Menu>
                                <Link href={`/users/${u._id}`}>
                                    <Dropdown.Item text='View Profile' />
                                </Link>
                                {u.deleted ?
                                    <Dropdown.Item text='Unlock account' onClick={() => unlock(u._id)} />
                                    : <Dropdown.Item text='Lock account' onClick={() => lock(u._id)} />
                                }
                                {isRoot && <Dropdown.Item text='Add admin role' onClick={() => addAdmin(u._id)} />}
                            </Dropdown.Menu>
                        </Dropdown>
                    </Table.Cell>
                </Table.Row>
            )
        }</Table.Body>
    </Table>
}

function Pagination1({ page, setPage, limit, setLimit, count }) {
    return <div>
        <Pagination
            activePage={page}
            onPageChange={(_, { activePage }) => setPage(activePage)}
            totalPages={Math.ceil(count / limit)}
            ellipsisItem={false}
        />
        <form onSubmit={e => {
            e.preventDefault();
            setLimit(e.target.limit.value);
        }}>
            <Form.Input type='number' name='limit' label='Items per page' defaultValue={limit} />
        </form>
    </div>
}