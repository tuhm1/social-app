import { Button } from "semantic-ui-react";
import Script from 'react-load-script';

export default function DrivePicker({ onSelect, multiple, accept }) {
    const onClick = () => {
        gapi.load('client:auth2:picker', async () => {
            const gUser = await auth();
            const accessToken = gUser.getAuthResponse().access_token;
            const selected = await renderPicker(accessToken, multiple, accept);
            const files = await Promise.all(selected.map(i => toFile(accessToken, i)));
            if (files?.length > 0) {
                onSelect(files);
            }
        });
    };
    return <div>
        <Script url='https://apis.google.com/js/api.js' />
        <Button
            icon='google drive'
            type='button'
            onClick={onClick}
        />
    </div>
}

async function auth() {
    let gAuth = gapi.auth2.getAuthInstance();
    if (!gAuth) {
        await gapi.auth2.init({
            clientId: process.env.GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.readonly',
        });
        gAuth = gapi.auth2.getAuthInstance();
    }
    if (!gAuth.isSignedIn.get())
        await gAuth.signIn();
    return gAuth.currentUser.get().grant({ scope: 'https://www.googleapis.com/auth/drive.readonly' });
}

function renderPicker(accessToken, multiple, accept) {
    return new Promise(resolve => {
        const builder = new google.picker.PickerBuilder()
            .setOAuthToken(accessToken)
            .enableFeature(google.picker.Feature.NAV_HIDDEN)
            .enableFeature(google.picker.Feature.MINE_ONLY);
        if (multiple) {
            builder.enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
        }
        builder.setCallback(eventArgs => {
            if (eventArgs.action === google.picker.Action.PICKED) {
                return resolve(eventArgs.docs);
            }
            if (eventArgs.action === google.picker.Action.CANCEL) {
                return resolve([]);
            }
        });
        const view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes(accept);
        builder.addView(view)
            .build()
            .setVisible(true);
    });
}

function toFile(accessToken, file) {
    const url = `https://www.googleapis.com/drive/v3/files/${file.id}?key=${process.env.GOOGLE_CLIENT_ID}&alt=media`;
    const headers = { 'Authorization': `Bearer ${accessToken}` };
    return fetch(url, { headers })
        .then(res => res.blob())
        .then(blob => new File([blob], file.name));
}