import { CarouselProvider, Image, Slide, Slider } from "pure-react-carousel";
import 'pure-react-carousel/dist/react-carousel.es.css';
import { useState } from "react";
import css from '../../styles/Carousel.module.css';
const Carousel = ({ files, style, className }) => {
    const [current, setCurrent] = useState(0);
    return <CarouselProvider
        naturalSlideWidth={16}
        naturalSlideHeight={9}
        totalSlides={files.length}
        currentSlide={current}
    >
        <div style={style} className={className}>
            <Slider>
                {files.map(({ url, resourceType }) =>
                    <Slide key={url}>
                        {resourceType === 'image'
                            ? <Image src={url} className={css.media} />
                            : <video src={url} controls autoPlay muted={true} className={css.media} />
                        }
                    </Slide>
                )}
            </Slider>
            {files.length > 1
                && <div className={css.preview}>
                    {files.map(({ url, resourceType }, i) =>
                        <img
                            onClick={() => setCurrent(i)}
                            src={resourceType === 'image'
                                ? url
                                : [...url.split('.').slice(0, -1), 'webp'].join('.')
                            }
                            className={`${css.thumbnail} ${i === current ? css.active : ''}`}
                            key={url}
                        />
                    )}
                </div>
            }
        </div>
    </CarouselProvider>;
}

export default Carousel;
