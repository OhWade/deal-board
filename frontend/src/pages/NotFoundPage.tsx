import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p className="muted">
        That page doesn't exist. <Link to="/">Go to the sales board</Link>
      </p>
    </div>
  );
}
