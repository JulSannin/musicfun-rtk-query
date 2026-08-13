import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { Provider } from "react-redux";
import { store } from "./app/model/store";
import { App } from "./app";
import "./index.css";

// точка входа приложения
// оборачиваем App в провайдеры:
// BrowserRouter дает роутинг, Provider дает доступ к redux store
// восклицательный знак у getElementById: React ждет элемент, а не null,
// и мы знаем, что div#root есть в index.html
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>,
);
