import { Header } from '@/widgets/header'
import { Routing } from './routing/Routing'
import s from './App.module.css'
import { ToastContainer } from 'react-toastify'
// стили тостов не подключаются сами: без этого импорта
// разметка в DOM появится, но будет без позиционирования и фона
import 'react-toastify/dist/ReactToastify.css'

// корневой компонент приложения
// Header виден всегда, внутри layout меняются страницы по текущему роуту
function App() {
    return (
        <>
            <Header />
            <div className={s.layout}>
                <Routing />
            </div>
            {/* контейнер тостов один на все приложение и стоит вне layout: */}
            {/* toast() зовется из любого компонента, а рисуется всегда здесь */}
            {/* тема задается один раз тут, а не в каждом вызове toast */}
            <ToastContainer theme="colored" />
        </>
    )
}

export { App }
