
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LayoutWrapper from "./components/LayoutWrapper";
import ExamList from "./ExamList";


export default async function Home() {



  return (
    <LayoutWrapper>
      <main className="pt-24 px-6 min-h-screen">
        <ExamList />
      </main>
    </LayoutWrapper>
  );
}

