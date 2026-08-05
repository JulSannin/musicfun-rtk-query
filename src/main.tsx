import {createRoot} from "react-dom/client";
import {BrowserRouter} from "react-router";
import {Provider} from "react-redux";
import {store} from "./app/model/store";
import {App} from "./app";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <Provider store={store}>
            <App />
        </Provider>
    </BrowserRouter>,
);
