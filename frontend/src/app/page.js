
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ExamNavbar from "./Navbar";
import ExamList from "./ExamList";


export default async function Home() {



  return (
   <>
    <ExamNavbar />
    <main className="pt-24 px-6 min-h-screen">
      <ExamList />
    </main>
    
   </>
  );
}
