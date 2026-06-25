import "../styles/globals.css";
import "katex/dist/katex.min.css";

export const metadata = {
  title: "LMS MCQ Platform",
  description: "MCQ Testing Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}