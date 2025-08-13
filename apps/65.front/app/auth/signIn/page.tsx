import ConnectionForm from "./connectionForm";

export default async function Home() {
  return (
    <>
      <h2 className="font-bold text-3xl text-center mb-12">Bienvenue</h2>
      <ConnectionForm />
    </>
  );
}
