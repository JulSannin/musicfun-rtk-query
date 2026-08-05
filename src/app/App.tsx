import {Header} from "@/common"
import {Routing} from "./routing/Routing"
import s from "./App.module.css"

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
