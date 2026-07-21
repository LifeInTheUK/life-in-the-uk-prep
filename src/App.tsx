import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import QuizPage from "./QuizPage";
import ReviewPage from "./ReviewPage";
import StatsPage from "./StatsPage";

export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<QuizPage />} />
                <Route path="/review" element={<ReviewPage />} />
                <Route path="/stats" element={<StatsPage />} />
            </Route>
        </Routes>
    );
}
