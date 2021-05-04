import { useEffect, useRef, useState } from "react";
import Script from 'react-load-script';

let galleryWidgetCount = 0;

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
};

export default function GalleryWidget({ files, options = {} }) {
    const ref = useRef(null);
    const [_cloudinary, setCloudinary] = useState();
    let [containerId] = useState(() => `widget-${galleryWidgetCount++}`);
    useEffect(() => {
        if (ref && _cloudinary) {
            const widget = _cloudinary.galleryWidget({
                container: `#${containerId}`,
                cloudName: process.env.CLOUDINARY_CLOUD_NAME,
                mediaAssets: files.map(({ publicId, resourceType }) =>
                    ({ publicId, mediaType: resourceType })
                ),
                ...defaultOptions,
                ...options
            });
            widget.render();
            return () => widget.destroy();
        }
    }, [ref, _cloudinary, options]);
    return <>
        <Script
            url='https://product-gallery.cloudinary.com/all.js'
            onLoad={() => setCloudinary(cloudinary)}
        />
        <div ref={ref} id={containerId} />
    </>
}

