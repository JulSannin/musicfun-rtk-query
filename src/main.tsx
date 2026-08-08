import {createRoot} from "react-dom/client";
import {BrowserRouter} from "react-router";
import {Provider} from "react-redux";
import {store} from "./app/model/store";
import {App} from "./app";
import "./index.css";

// точка входа приложения
// оборачиваем App в провайдеры:
// BrowserRouter дает роутинг, Provider дает доступ к redux store
createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <Provider store={store}>
            <App />
        </Provider>
    </BrowserRouter>,
);
