import {Header} from "@/common"
import {Routing} from "./routing/Routing"
import s from "./App.module.css"

// корневой компонент приложения
// Header виден всегда, внутри layout меняются страницы по текущему роуту
function App() {
    return (
        <>
            <Header />
            <div className={s.layout}>
                <Routing />
            </div>
        </>
    );
}

export {App};
