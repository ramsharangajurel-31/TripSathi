import { useState } from "react";
import { FiImage } from "react-icons/fi";
import classNames from "../../utils/classNames";

/**
 * Image with a loading placeholder and a branded fallback.
 * Guarantees the layout never shows a broken-image icon: if `src` is empty
 * or fails to load, a neutral panel with an icon (and optional label) is
 * shown in the same space.
 *
 * Props
 *  src             image URL or local path ("/images/pokhara.jpg")
 *  alt             description for screen readers. Use "" for purely
 *                  decorative images
 *  fallbackLabel   short text shown in the fallback panel (e.g. "Pokhara")
 *  priority        true for above-the-fold images (hero): loads immediately
 *                  instead of lazily
 *  className       extra class for the wrapper
 *  imgClassName    extra class for the <img>
 *  ...rest         other <img> attributes (width, height, sizes ...)
 *
 * The wrapper fills its parent (width and height 100%). Give the parent a
 * size or aspect ratio, as .card__media already does.
 *
 * Example
 *  <div className="card__media">
 *    <SafeImage src={destination.image} alt={`${destination.name}, Nepal`}
 *               fallbackLabel={destination.name} />
 *  </div>
 */
export default function SafeImage({
  src,
  alt = "",
  fallbackLabel,
  priority = false,
  className,
  imgClassName,
  ...rest
}) {
  // Track results per URL so changing `src` resets the state without an effect.
  const [failedSrc, setFailedSrc] = useState(null);
  const [loadedSrc, setLoadedSrc] = useState(null);

  const failed = !src || failedSrc === src;
  const loaded = loadedSrc === src;

  if (failed) {
    return (
      <div className={classNames("safe-image", className)}>
        <div
          className="safe-image__fallback"
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
        >
          <FiImage size={28} aria-hidden="true" />
          {fallbackLabel && <span>{fallbackLabel}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={classNames("safe-image", className)}>
      {!loaded && (
        <span className="skeleton safe-image__skeleton" aria-hidden="true" />
      )}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={classNames(
          "safe-image__img",
          loaded && "is-loaded",
          imgClassName
        )}
        onLoad={() => setLoadedSrc(src)}
        onError={() => setFailedSrc(src)}
        {...rest}
      />
    </div>
  );
}