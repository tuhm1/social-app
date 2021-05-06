import { Button, List } from "semantic-ui-react";
import LocalPicker from './LocalPicker';
import DrivePicker from './DrivePicker';

export default function InputFile({ accept, multiple, value, onChange, image, video, audio }) {
    if (image || video || audio) {
        accept = withAcceptShorthands(accept, image, video, audio);
    }
    const onSelect = selected => {
        onChange(multiple ? [...value, ...selected] : selected);
    };
    const onRemove = selected => {
        onChange(value.filter(f => f != selected));
    };
    return <div>
        <div style={{ display: 'flex' }}>
            <LocalPicker
                onSelect={onSelect}
                accept={accept}
                multiple={multiple}
            />
            <DrivePicker
                onSelect={onSelect}
                accept={accept}
                multiple={multiple}
            />
        </div>
        <List
            divided
            verticalAlign='middle'
        >
            {value?.map((file, i) =>
                <List.Item key={i}>
                    <List.Content floated='right'>
                        <Button
                            onClick={() => onRemove(file)}
                            icon='delete' compact
                            type='button'
                        />
                    </List.Content>
                    <List.Icon name='file' />
                    <List.Content>{file.name}</List.Content>
                </List.Item>
            )}
        </List>
    </div>;
}

function withAcceptShorthands(accept, image, video, audio) {
    if (!accept)
        accept = [];
    if (image)
        accept = accept.concat([
            'image/jpeg',
            'image/jpg',
            'image/gif',
            'image/png',
            'image/bmp'
        ]);
    if (video)
        accept = accept.concat([
            'video/x-flv',
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-ms-wmv',
            'video/ogg',
            'video/webm',
            'video/3gpp'
        ]);
    if (audio)
        accept = accept.concat([
            'audio/aac',
            'audio/mp4',
            'audio/mpeg',
            'audio/ogg',
            'audio/wav',
            'audio/webm',
            'audio/mp3',
            'audio/3gpp'
        ]);
    accept = accept.join(',');
    return accept;
}
