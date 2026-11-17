import styles from "./StartCollage.module.css";

/** The start screen's four cards, laid out to fill the photo panel without cropping the text. */
export function StartCollage() {
  return (
    <div className={styles.collage}>
      <div className={styles.top}>
        {/* eslint-disable @next/next/no-img-element -- pre-cropped static assets */}
        <img src="/img/quiz/intro-order.webp" alt="" className={styles.tall} />
        <img src="/img/quiz/intro-cook.webp" alt="" className={styles.tall} />
        <img src="/img/quiz/intro-track.webp" alt="" className={`${styles.wide} ${styles.track}`} />
        <img src="/img/quiz/intro-free.webp" alt="" className={`${styles.wide} ${styles.free}`} />
        {/* eslint-enable @next/next/no-img-element */}
      </div>
    </div>
  );
}
