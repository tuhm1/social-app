import { useEffect, useRef, useState } from "react";
import Script from 'react-load-script';
import { nanoid } from 'nanoid';

const defaultOptions = {
    zoomProps: {
        type: "popup",
        trigger: "click"
    },
    carouselLocation: 'bottom',
    thumbnailProps: {
        selectedBorderPosition: 'all'
    },
    videoProps: {
        controls: 'all'
    },
    aspectRatio: '16:9'
};

export default function GalleryWidget({ files, options = {}, style, className }) {
    const ref = useRef(null);
    const [_cloudinary, setCloudinary] = useState();
    const [widget, setWidget] = useState();
    useEffect(() => {
        if (ref && _cloudinary) {
            let containerId = nanoid();
            if (!/[a-z]|[A-Z]/.test(containerId[0]))
                containerId = 'a' + containerId;
            ref.current.id = containerId;
            const widget = _cloudinary.galleryWidget({
                container: `#${containerId}`,
                cloudName: process.env.CLOUDINARY_CLOUD_NAME,
                mediaAssets: []
            });
            widget.render()
                .then(() => setWidget(widget))
            return () => widget.destroy();
        }
    }, [ref, _cloudinary]);
    useEffect(() => {
        if (widget) {
            widget.update({
                mediaAssets: files.map(({ publicId, resourceType: mediaType }) => ({ publicId, mediaType })),
                ...defaultOptions,
                ...options,
            });
        }
    }, [widget, JSON.stringify(options), ...files.map(f => f.publicId)])
    return <>
        <Script
            url='https://product-gallery.cloudinary.com/all.js'
            onLoad={() => setCloudinary(cloudinary)}
        />
        <div ref={ref} style={style} className={className} />
    </>
}