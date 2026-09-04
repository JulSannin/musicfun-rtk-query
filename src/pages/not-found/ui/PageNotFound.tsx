import s from './PageNotFound.module.css';

// страница 404
// показывается на любом адресе, которого нет в роутере
export const PageNotFound = () => {
    return (
        <>
            <h1 className={s.title}>404</h1>
            <h2 className={s.subtitle}>page not found</h2>
        </>
    );
};
