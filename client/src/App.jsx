import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SiteNavbar from "./components/Frontend/SiteNavbar";
import AnimatedPage from "./components/Frontend/AnimatedPage";
import RouteFallback from "./components/Frontend/RouteFallback";

import "bootstrap/dist/css/bootstrap.min.css";
import "./components/Styling/animations.css";
import "./App.css";

const Home = lazy(() => import("./components/Frontend/homePage"));
const Login = lazy(() => import("./components/Frontend/loginPage"));
const AdminDashboard = lazy(() => import("./components/Frontend/adminDashboard"));
const EmployeeDashboard = lazy(() => import("./components/Frontend/employeeDashboard"));
const Gemini = lazy(() => import("./components/Frontend/chatBot"));
const FeedBack = lazy(() => import("./components/Frontend/feedBack"));
const AboutPage = lazy(() => import("./components/Frontend/aboutPage"));
const FeaturePage = lazy(() => import("./components/Frontend/featurePage"));

function App() {
  return (
    <Router>
      <SiteNavbar />
      <main id="main-content">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
            <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
            <Route path="/admin" element={<AnimatedPage><AdminDashboard /></AnimatedPage>} />
            <Route path="/employee" element={<AnimatedPage><EmployeeDashboard /></AnimatedPage>} />
            <Route path="/gemini" element={<AnimatedPage><Gemini /></AnimatedPage>} />
            <Route path="/feedback/:id" element={<AnimatedPage><FeedBack /></AnimatedPage>} />
            <Route path="/about" element={<AnimatedPage><AboutPage /></AnimatedPage>} />
            <Route path="/features" element={<AnimatedPage><FeaturePage /></AnimatedPage>} />
          </Routes>
        </Suspense>
      </main>
    </Router>
  );
}

export default App;
