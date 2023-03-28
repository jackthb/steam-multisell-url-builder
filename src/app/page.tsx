import { Inter } from "next/font/google";
import { CasePicker } from "./components/CasePicker";
// https://steamapis.com/docs/market#stats

export default function Home() {
  return (
    <main className="m-4">
      <div>
        <CasePicker />
      </div>
    </main>
  );
}
