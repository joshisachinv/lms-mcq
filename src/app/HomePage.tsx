import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>LMS - MCQ Exam Platform</h1>
      <p>Select how you want to enter the platform.</p>

      <div style={{ display: "flex", gap: "20px", marginTop: "30px" }}>
        <Link href="/admin">
          <button style={{ padding: "20px", fontSize: "18px" }}>Admin</button>
        </Link>

        <Link href="/student">
          <button style={{ padding: "20px", fontSize: "18px" }}>Student</button>
        </Link>
      </div>
    </main>
  );
}