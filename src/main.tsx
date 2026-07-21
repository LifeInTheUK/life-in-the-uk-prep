import "./style.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// No StrictMode: QuizPage bridges into quiz.ts's imperative DOM code, and
// StrictMode's dev-only double-invoked effects would attach duplicate event
// listeners to the same (not actually remounted) DOM nodes.
createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <App />
    </BrowserRouter>,
);
