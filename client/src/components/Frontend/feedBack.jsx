import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const pageContent = {
    generic: {
        brand: "PhishAware Portal",
        heading: "Sign in to continue",
        subheading: "Use your work account to continue.",
        accent: "#1769e0",
        background: "linear-gradient(135deg, #eef4ff, #e8edf7)",
        logo: "🔐"
    },
    google: {
        brand: "Google",
        heading: "Sign in",
        subheading: "Use your Google Account",
        accent: "#1a73e8",
        background: "#f0f4f9",
        logo: "G"
    },
    microsoft: {
        brand: "Microsoft",
        heading: "Sign in",
        subheading: "to continue to Microsoft 365",
        accent: "#0067b8",
        background: "#f3f3f3",
        logo: "▦"
    }
};

function FeedBack() {
    const { id: campaignId } = useParams();
    const [pageType, setPageType] = useState("generic");
    const [pageReady, setPageReady] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [breached, setBreached] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        fetch(`${import.meta.env.VITE_API_URL}/api/feedback/${encodeURIComponent(campaignId || "")}`)
            .then(async (response) => {
                if (!response.ok) throw new Error("This simulation link is unavailable.");
                return response.json();
            })
            .then((data) => {
                if (active && pageContent[data.feedback_page_type]) setPageType(data.feedback_page_type);
            })
            .catch((err) => {
                if (active) setLoadError(err.message || "Unable to load this page.");
            })
            .finally(() => {
                if (active) setPageReady(true);
            });
        return () => { active = false; };
    }, [campaignId]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/capture`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Passwords are intentionally not sent to or stored by the simulation.
                body: JSON.stringify({ username, campaignId })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to record this simulation.");
            setPassword("");
            setBreached(true);
        } catch (err) {
            setError(err.message || "Unable to record this simulation.");
        } finally {
            setSubmitting(false);
        }
    };

    const page = pageContent[pageType];

    if (!pageReady) return <main className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: "#f3f4f6" }}>Loading simulation…</main>;
    if (loadError) return <main className="min-vh-100 d-flex align-items-center justify-content-center p-4"><p role="alert">{loadError}</p></main>;

    return (
        <main className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ background: page.background }}>
            <section className="card border-0 shadow-sm w-100" style={{ maxWidth: pageType === "generic" ? 440 : 450, borderRadius: pageType === "generic" ? 20 : 8 }}>
                <div className="card-body p-4 p-md-5">
                    <header className="mb-4">
                        <div className="d-flex align-items-center gap-2 mb-4" style={{ color: page.accent, fontSize: 22, fontWeight: 600 }}>
                            {pageType === "microsoft" ? (
                                <span aria-hidden className="d-inline-grid" style={{ gridTemplateColumns: "repeat(2, 9px)", gap: 2, color: "#f25022", fontSize: 17, lineHeight: "9px" }}>■<span style={{ color: "#7fba00" }}>■</span><span style={{ color: "#00a4ef" }}>■</span><span style={{ color: "#ffb900" }}>■</span></span>
                            ) : <span aria-hidden style={{ fontWeight: 700 }}>{page.logo}</span>}
                            <span>{page.brand}</span>
                        </div>
                        <h1 className="h3 fw-normal mb-2">{page.heading}</h1>
                        <p className="text-secondary mb-0">{page.subheading}</p>
                    </header>

                    {breached ? (
                        <div role="status" className="alert alert-warning mb-0">
                            <h2 className="h5">This was a phishing awareness simulation.</h2>
                            <p className="mb-0">The password you entered was not stored. Check the sender and web address before signing in from a link.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="feedback-username" className="form-label">Email or username</label>
                                <input id="feedback-username" className="form-control" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="feedback-password" className="form-label">Password</label>
                                <input id="feedback-password" type="password" className="form-control" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            {error && <div role="alert" className="alert alert-danger py-2">{error}</div>}
                            <button type="submit" disabled={submitting} className="btn text-white w-100" style={{ backgroundColor: page.accent }}>
                                {submitting ? "Please wait…" : "Sign in"}
                            </button>
                        </form>
                    )}
                    <footer className="small text-secondary mt-4">Training simulation · Passwords are not stored</footer>
                </div>
            </section>
        </main>
    );
}

export default FeedBack;
