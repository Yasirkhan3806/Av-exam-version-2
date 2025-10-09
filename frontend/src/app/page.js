import LayoutWrapper from "./components/LayoutWrapper";
import { redirect } from 'next/navigation';

export default async function Home() {
  redirect('/StudentDashboard');

  // The code below won't execute due to the redirect
  return (
    <LayoutWrapper>
      <main className="pt-24 px-6 min-h-screen">
        {/* <ExamList /> */}
      </main>
    </LayoutWrapper>
  );
}

