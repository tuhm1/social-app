import { Button } from "semantic-ui-react";

const LocalPicker = ({ onSelect, multiple, accept }) => {
    return <div>
        <label htmlFor="local-picker">
            <Button
                as='span'
                icon='folder'
                type='button'
                content='Browse'
            />
        </label>
        <input
            id="local-picker"
            type="file"
            accept={accept}
            multiple={multiple}
            capture
            onChange={e => {
                onSelect([...e.target.files]);
                e.target.value = null;
            }}
            style={{ display: 'none' }}
        />
    </div>
};

export default LocalPicker;
