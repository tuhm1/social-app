import axios from "axios";
import Error from 'next/error';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from "react";
import { useQuery } from "react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Label } from 'recharts';
import { Form, Menu, Segment, Statistic, Icon, Select } from "semantic-ui-react";
import css from '../../styles/admin/index.module.css';

export default function Dashboard() {
    const [groupUser, setGroupUser] = useState('month');
    const [groupPost, setGroupPost] = useState('month');
    let { data: users, error: errorUser } = useQuery(['/api/admin/users/statistic', groupUser], () =>
        axios.get('/api/admin/users/statistic', { params: { groupBy: groupUser } })
            .then(res => res.data)
    );
    let { data: posts, error: errorPost } = useQuery(['/api/admin/posts/statistic', groupPost], () =>
        axios.get('/api/admin/posts/statistic', { params: { groupBy: groupPost } })
            .then(res => res.data)
    );
    let { data: usersCount, error: errorUserCount } = useQuery('/api/admin/users/count', () =>
        axios.get('/api/admin/users/count').then(res => res.data)
    );
    let { data: postsCount, error: errorPostCount } = useQuery('/api/admin/posts/count', () =>
        axios.get('/api/admin/posts/count').then(res => res.data)
    );
    if (errorUser) {
        return <Error
            statusCode={errorUser.response?.status}
            title={errorUser.response?.data.message || errorUser.message}
        />
    }
    if (errorPost) {
        return <Error
            statusCode={errorPost.response?.status}
            title={errorPost.response?.data.message || errorPost.message}
        />
    }
    if (errorUserCount) {
        return <Error
            statusCode={errorUserCount.response?.status}
            title={errorUserCount.response?.data.message || errorUserCount.message}
        />
    }
    if (errorPostCount) {
        return <Error
            statusCode={errorPostCount.response?.status}
            title={errorPostCount.response?.data.message || errorPostCount.message}
        />
    }
    return <div className={css.page}>
        <Head>
            <title>Dashboard</title>
        </Head>
        <PageMenu />
        <div className={css.content}>
            <Menu secondary>
                <Menu.Item header>Dashboard</Menu.Item>
            </Menu>
            <div>
                <div>
                    <Statistic>
                        <Statistic.Label>
                            <Icon name='group' />
                            Users
                        </Statistic.Label>
                        <Statistic.Value>{usersCount}</Statistic.Value>
                    </Statistic>
                    <Statistic>
                        <Statistic.Label>
                            <Icon name='images' />
                            Post
                        </Statistic.Label>
                        <Statistic.Value>{postsCount}</Statistic.Value>
                    </Statistic>
                </div>
                <div className={css.charts}>
                    <UsersGraph data={users} groupBy={groupUser} setGroupBy={setGroupUser} />
                    <PostsGraph data={posts} groupBy={groupPost} setGroupBy={setGroupPost} />
                </div>
            </div>
        </div>
    </div>
}

function PageMenu() {
    return <Menu vertical>
        <Link href='/admin'>
            <Menu.Item as='a' active>Dashboard</Menu.Item>
        </Link>
        <Link href='/admin/users'>
            <Menu.Item as='a'>Users</Menu.Item>
        </Link>
        <Link href='/admin/posts'>
            <Menu.Item as='a'>Posts</Menu.Item>
        </Link>
    </Menu>
}

function UsersGraph({ data, groupBy, setGroupBy }) {
    if (!data) return null;
    data = data.map(i => ({
        key: groupBy === 'month'
            ? `${i._id.month}/${i._id.year}`
            : `${i._id.year}`,
        ...i
    }));
    const download = () => {
        let csv = "data:text/csv;charset=utf-8,"
            + `${groupBy}, new users\n`
            + data.map(i => `${i.key}, ${i.count}`)
                .join('\n');
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csv));
        link.setAttribute("download", `new_users_by_${groupBy}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
    return <div className={css.userChart}>
        <Menu secondary pointing>
            <Menu.Item header>New users</Menu.Item>
            <Menu.Item position='right' icon='download' content='Details' onClick={download} />
        </Menu>
        <Select
            placeholder='Group by'
            value={groupBy}
            onChange={(_, { value }) => setGroupBy(value)}
            options={[
                { key: 'year', text: 'Year', value: 'year' },
                { key: 'month', text: 'Month', value: 'month' }
            ]}
        />
        <ResponsiveContainer width='100%' aspect={1}>
            <LineChart data={data}>
                <Line type="monotone" dataKey="count" stroke="#8884d8" />
                <XAxis dataKey='key' label={{ value: 'time', position: 'insideBottom', offset: 0 }} />
                <YAxis dataKey='count' label={{ value: 'users', angle: -90 }} />
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                <Tooltip />
            </LineChart>
        </ResponsiveContainer>
    </div>
}

function PostsGraph({ data, groupBy, setGroupBy }) {
    if (!data) return null;
    data = data?.map(i => ({
        key: groupBy === 'month'
            ? `${i._id.month}/${i._id.year}`
            : `${i._id.year}`,
        ...i
    }));
    const download = () => {
        let csv = "data:text/csv;charset=utf-8,"
            + `${groupBy}, new posts\n`
            + data.map(i => `${i.key}, ${i.count}`)
                .join('\n');
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csv));
        link.setAttribute("download", `new_posts_by_${groupBy}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
    return <div className={css.postChart}>
        <Menu secondary pointing>
            <Menu.Item header>New posts</Menu.Item>
            <Menu.Item position='right' icon='download' content='Details' onClick={download} />
        </Menu>
        <Select
            placeholder='Group by'
            value={groupBy}
            onChange={(_, { value }) => setGroupBy(value)}
            options={[
                { key: 'year', text: 'Year', value: 'year' },
                { key: 'month', text: 'Month', value: 'month' }
            ]}
        />
        <ResponsiveContainer width='100%' aspect={1}>
            <LineChart data={data}>
                <Line type="monotone" dataKey="count" stroke="#82ca9d" />
                <XAxis dataKey='key' label={{ value: 'time', position: 'insideBottom', offset: 0 }} />
                <YAxis dataKey='count' label={{ value: 'posts', angle: -90 }} />
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                <Tooltip />
            </LineChart>
        </ResponsiveContainer>
    </div>
}