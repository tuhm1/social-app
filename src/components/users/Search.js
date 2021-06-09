import axios from "axios";
import Link from 'next/link';
import React, { useState } from "react";
import {
    Modal,
    Search as SematicUISearch
} from "semantic-ui-react";

export default function Search({ trigger }) {
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState();
    const [loading, setLoading] = useState(false);
    const onSearchChange = (e, data) => {
        setResults();
        if (data.value.length > 0) {
            setLoading(true);
            axios.get(`/api/user`, { params: { q: data.value } })
                .then(res => {
                    setResults(res.data);
                    setLoading(false);
                });
        }
    };
    return <Modal
        basic
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        closeIcon
        trigger={trigger}
        size='mini'
        centered={false}
        header='Search'
        content={<SematicUISearch
            onSearchChange={onSearchChange}
            onResultSelect={() => setOpen(false)}
            resultRenderer={ResultRenderer}
            input={{ fluid: true }}
            fluid
            results={results}
            loading={loading}
        />}
    />

}

function ResultRenderer({ _id, avatar, firstName, lastName, username, email }) {
    return <Link href={`/users/${_id}`} key={_id} >
        <a style={{ color: 'unset' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
                <img src={avatar || '/default-avatar.svg'} style={{ width: '3em', height: '3em' }} />
                <div style={{ marginLeft: '0.5em' }}>
                    <a style={{ fontWeight: 'bold' }}>
                        {`${firstName} ${lastName}`}
                    </a>
                    <p>{email || `@${username}`}</p>
                </div>
            </div>
        </a>
    </Link>
}